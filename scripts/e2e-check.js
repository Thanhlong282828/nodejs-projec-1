import assert from "node:assert/strict";
import request from "supertest";
import { io as client } from "socket.io-client";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";
import { createHttpServer } from "../src/server.js";
import { db } from "../src/lib/db.js";
import {
  User,
  Employee,
  Outbox,
  Audit,
  Department,
} from "../src/models/index.js";
import { dispatch, getQueue, closeQueue } from "../src/queue/index.js";
import { redis } from "../src/lib/redis.js";
import { config } from "../src/config.js";
// Test này dùng cổng ngẫu nhiên, không điều khiển trình duyệt và không gửi email ra bên ngoài.
const suffix = `e2e-${Date.now()}`;
const { server, io } = createHttpServer();
server.listen(0, "127.0.0.1");
await once(server, "listening");
const url = `http://127.0.0.1:${server.address().port}`;
let socket, employeeId, userId, eventId, failedJob;
const wait = async (fn, label) => {
  for (let i = 0; i < 400; i++) {
    const result = await fn();
    if (result) return result;
    await delay(100);
  }
  throw new Error(`Timeout: ${label}`);
};
try {
  const login = await request(server)
    .post("/api/auth/login")
    .send({ email: "admin@hrm.local", password: "HrmDemo123!" });
  assert.equal(login.status, 200);
  const token = login.body.data.token;
  const unauth = client(url, {
    transports: ["websocket"],
    reconnection: false,
  });
  const [failure] = await once(unauth, "connect_error");
  assert.match(failure.message, /Unauthorized/);
  unauth.disconnect();
  console.log("PASS realtime rejects unauthenticated connection");
  socket = client(url, {
    auth: { token },
    transports: ["websocket"],
    reconnection: false,
  });
  await once(socket, "connect");
  const changes = once(socket, "hrm:changed");
  const department = await Department.findOne();
  const body = {
    name: "E2E Demo Employee",
    email: `${suffix}@example.test`,
    password: "StrongTest123!",
    role: "employee",
    code: suffix,
    departmentId: department.id,
    position: "Integration Engineer",
    joinedOn: "2026-10-01",
    salary: 15000000,
    status: "active",
  };
  const created = await request(server)
    .post("/api/employees")
    .set("Authorization", `Bearer ${token}`)
    .send(body);
  assert.equal(created.status, 201, JSON.stringify(created.body));
  employeeId = created.body.data.id;
  userId = created.body.data.userId;
  assert.equal((await changes)[0].topic, "employee.created");
  console.log(
    "PASS transactional employee creation and authenticated Socket.IO delivery",
  );
  const rows = await Outbox.findAll();
  const event = rows.find(
    (row) => row.payload.userId === userId && row.topic === "employee.created",
  );
  assert.ok(event);
  eventId = event.id;
  await dispatch();
  const message = await wait(async () => {
    const r = await fetch(
      `${config.notificationUrl}/internal/messages?userId=${userId}`,
      { headers: { "x-internal-key": config.internalKey } },
    );
    assert.equal(r.status, 200);
    const rows = (await r.json()).data;
    return rows.find((row) => row.eventId === eventId && row.status === "sent");
  }, "notification sent");
  assert.equal(message.recipient, body.email);
  const inbox = await fetch("http://127.0.0.1:8037/api/v1/messages").then((r) =>
    r.json(),
  );
  assert.ok(
    inbox.messages.some((m) => m.To.some((to) => to.Address === body.email)),
  );
  console.log(
    "PASS outbox → Redis/BullMQ → separate service → notification DB → SMTP/Mailpit",
  );
  assert.equal(
    (
      await fetch(
        `${config.notificationUrl}/internal/messages?userId=${userId}`,
      )
    ).status,
    401,
  );
  console.log(
    "PASS microservice internal endpoint rejects missing service key",
  );
  // Job trùng event đã gửi sẽ không gửi lại (khóa event_id tại service nhận).
  const duplicate = await getQueue().add(
    "employee.created",
    { eventId, ...event.payload },
    { jobId: `duplicate-${eventId}`, attempts: 1 },
  );
  await wait(
    async () => (await duplicate.getState()) === "completed",
    "duplicate processed",
  );
  const inboxAfter = await fetch("http://127.0.0.1:8037/api/v1/messages").then(
    (r) => r.json(),
  );
  assert.equal(
    inboxAfter.messages.filter((m) =>
      m.To.some((to) => to.Address === body.email),
    ).length,
    inbox.messages.filter((m) => m.To.some((to) => to.Address === body.email))
      .length,
  );
  console.log("PASS consumer deduplicates a previously completed event");
  failedJob = await getQueue().add(
    "invalid-contract",
    {},
    {
      jobId: `bad-${suffix}`,
      attempts: 2,
      backoff: { type: "fixed", delay: 100 },
    },
  );
  await wait(
    async () => (await failedJob.getState()) === "failed",
    "retry exhausted",
  );
  assert.equal((await getQueue().getJob(failedJob.id)).attemptsMade, 2);
  console.log(
    "PASS queue retries twice then retains failed job for inspection",
  );
  console.log("E2E CHECKS PASSED");
} finally {
  socket?.disconnect();
  await new Promise((resolve) => io.close(resolve));
  if (server.listening) await new Promise((resolve) => server.close(resolve));
  if (employeeId) {
    await Audit.destroy({
      where: { entity: "Employee", entityId: employeeId },
    });
    await Employee.destroy({ where: { id: employeeId }, hooks: false });
  }
  if (userId) await User.destroy({ where: { id: userId } });
  // Notification/mail records intentionally retained as local demo evidence, labeled E2E.
  if (eventId) await Outbox.destroy({ where: { id: eventId } });
  if (failedJob) await failedJob.remove();
  await closeQueue();
  redis.disconnect();
  await db.close();
}
