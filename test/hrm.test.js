import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { Op } from "sequelize";
import { app } from "../src/app.js";
import { db } from "../src/lib/db.js";
import { redis, invalidate } from "../src/lib/redis.js";
import { closeQueue } from "../src/queue/index.js";
import {
  User,
  Employee,
  Department,
  Leave,
  Attendance,
  Audit,
  Outbox,
  DailyRun,
} from "../src/models/index.js";
import { dailyDigest } from "../src/scheduler-jobs.js";
import { employeeSchema, leaveSchema } from "../src/lib/validation.js";
import { migrator } from "../src/lib/migrations.js";
const suffix = `test-${Date.now()}`,
  users = [],
  employees = [],
  departments = [],
  leaves = [];
let admin, hr, staff, other;
const call = (method, url, token, body) => {
  const r = request(app)[method](url);
  if (token) r.set("Authorization", `Bearer ${token}`);
  return body ? r.send(body) : r;
};
const spec = (email, code, departmentId) => ({
  name: `Test Employee ${suffix}`,
  email,
  password: "StrongTest123!",
  role: "employee",
  code,
  departmentId,
  position: "QA Engineer",
  phone: "",
  joinedOn: "2026-10-01",
  salary: 15000000,
  status: "active",
});
async function login(email, password = "HrmDemo123!") {
  const r = await call("post", "/api/auth/login", null, { email, password });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  return r.body.data;
}
async function cleanup() {
  if (employees.length) {
    await Attendance.destroy({ where: { employeeId: employees } });
    await Leave.destroy({ where: { employeeId: employees } });
    await Employee.destroy({ where: { id: employees }, hooks: false });
  }
  if (users.length) {
    const rows = await Outbox.findAll();
    for (const row of rows)
      if (
        users.includes(row.payload.userId) ||
        row.payload.text?.includes(suffix)
      )
        await row.destroy();
    await Audit.destroy({
      where: {
        [Op.or]: [
          { actorId: users },
          { entity: "Employee", entityId: employees },
        ],
      },
    });
    await User.destroy({ where: { id: users } });
  }
  if (departments.length) {
    await Audit.destroy({
      where: { entity: "Department", entityId: departments },
    });
    await Department.destroy({ where: { id: departments }, hooks: false });
  }
  await DailyRun.destroy({ where: { id: `hr-digest-${suffix}` } });
  await invalidate();
  await closeQueue();
  redis.disconnect();
  await db.close();
}
test("HRM integration: real MySQL + Redis", async (t) => {
  try {
    await t.test("Migration rerun is idempotent", async () =>
      assert.equal((await migrator.up()).length, 0),
    );
    admin = await login("admin@hrm.local");
    hr = await login("hr@hrm.local");
    await t.test(
      "Explicit action URLs: old shared resource endpoints are removed",
      async () => {
        for (const path of [
          "/api/employees",
          "/api/departments",
          "/api/leaves",
          "/api/attendance",
          "/api/dashboard",
          "/api/audit",
          "/api/notifications",
          "/api/system",
        ]) {
          assert.equal(
            (await call("get", path, admin.token)).status,
            404,
            path,
          );
        }
        assert.equal(
          (await call("get", "/api/departments/list", admin.token)).status,
          200,
        );
        assert.equal(
          (await call("post", "/api/departments/list", admin.token, {})).status,
          404,
        );
        assert.equal(
          (await call("get", "/api/departments/create", admin.token)).status,
          404,
        );
      },
    );

    await t.test(
      "401 unauthenticated and invalid JWT; login rejects wrong password and cross-origin",
      async () => {
        assert.equal((await call("get", "/api/employees/list")).status, 401);
        assert.equal(
          (await call("get", "/api/employees/list", "broken")).status,
          401,
        );
        assert.equal(
          (
            await call("post", "/api/auth/login", null, {
              email: "admin@hrm.local",
              password: "wrong",
            })
          ).status,
          401,
        );
        assert.equal(
          (
            await request(app)
              .post("/api/auth/login")
              .set("Origin", "http://untrusted.example")
              .send({ email: "admin@hrm.local", password: "HrmDemo123!" })
          ).status,
          403,
        );
      },
    );
    let dep;
    await t.test(
      "Department create/update/delete + unique constraint + observer",
      async () => {
        let r = await call("post", "/api/departments/create", admin.token, {
          name: suffix,
          description: "Test department",
        });
        assert.equal(r.status, 201, JSON.stringify(r.body));
        dep = r.body.data.id;
        departments.push(dep);
        assert.equal(
          (
            await call("post", "/api/departments/create", admin.token, {
              name: suffix,
            })
          ).status,
          409,
        );
        r = await call("put", `/api/departments/update/${dep}`, admin.token, {
          name: suffix,
          description: "Updated",
        });
        assert.equal(r.status, 200);
        assert.ok(
          await Audit.count({
            where: { entity: "Department", entityId: dep, action: "created" },
          }),
        );
      },
    );
    await t.test(
      "Employee create persists ORM relations and transactional outbox; no password leaks",
      async () => {
        for (let i = 0; i < 2; i++) {
          const body = spec(
            `${suffix}-${i}@example.test`,
            `${suffix}-${i}`,
            dep,
          );
          const r = await call(
            "post",
            "/api/employees/create",
            admin.token,
            body,
          );
          assert.equal(r.status, 201, JSON.stringify(r.body));
          const detail = await call(
            "get",
            `/api/employees/detail/${r.body.data.id}`,
            admin.token,
          );
          assert.equal(detail.status, 200);
          assert.equal(detail.body.data.id, r.body.data.id);
          employees.push(r.body.data.id);
          users.push(r.body.data.userId);
          assert.equal(r.body.data.user.password, undefined);
          assert.equal(r.body.data.department.id, dep);
        }
        staff = await login(`${suffix}-0@example.test`, "StrongTest123!");
        other = await login(`${suffix}-1@example.test`, "StrongTest123!");
        const outbox = await Outbox.findAll();
        assert.equal(
          outbox.filter((r) => users.includes(r.payload.userId)).length,
          2,
        );
      },
    );
    await t.test(
      "Foreign key failure rolls back user, employee, audit and event",
      async () => {
        const before = await Audit.count();
        const r = await call(
          "post",
          "/api/employees/create",
          admin.token,
          spec(`${suffix}-invalid@example.test`, `${suffix}-bad`, 4294967295),
        );
        assert.equal(r.status, 422, JSON.stringify(r.body));
        assert.equal(
          await User.count({
            where: { email: `${suffix}-invalid@example.test` },
          }),
          0,
        );
        assert.equal(await Audit.count(), before);
      },
    );
    await t.test(
      "RBAC: employees cannot list/write employee records; HR cannot elevate role",
      async () => {
        assert.equal(
          (await call("get", "/api/employees/list", staff.token)).status,
          403,
        );
        assert.equal(
          (await call("get", "/api/audit/list", staff.token)).status,
          403,
        );
        assert.equal(
          (await call("get", "/api/system/status", hr.token)).status,
          403,
        );
        assert.equal(
          (
            await call("post", "/api/employees/create", hr.token, {
              ...spec(`${suffix}-evil@example.test`, `${suffix}-evil`, dep),
              role: "admin",
            })
          ).status,
          403,
        );
      },
    );
    await t.test(
      "Employee search/filter pagination + invalid query validation",
      async () => {
        const r = await call(
          "get",
          `/api/employees/list?search=${suffix}&departmentId=${dep}&page=1`,
          admin.token,
        );
        assert.equal(r.status, 200);
        assert.equal(r.body.data.pagination.total, 2);
        assert.equal(r.body.data.items.length, 2);
        assert.equal(
          (await call("get", "/api/employees/list?page=0", admin.token)).status,
          422,
        );
        assert.equal(
          (await call("get", "/api/employees/detail/invalid", admin.token))
            .status,
          422,
        );
        assert.equal(
          (await call("delete", `/api/departments/delete/${dep}`, admin.token))
            .status,
          409,
        );
      },
    );
    await t.test(
      "Validation rejects negative salary and impossible/reversed leave dates",
      async () => {
        assert.equal(
          employeeSchema.safeParse({
            ...spec("a@example.test", "X", dep),
            salary: -1,
          }).success,
          false,
        );
        for (const dates of [
          { startDate: "2026-02-30", endDate: "2026-03-02" },
          { startDate: "2026-12-03", endDate: "2026-12-01" },
        ])
          assert.equal(
            leaveSchema.safeParse({ type: "annual", reason: "Test", ...dates })
              .success,
            false,
          );
      },
    );
    await t.test(
      "Leave ownership, overlap guard, approval role, immutable decision + event",
      async () => {
        const body = {
          type: "annual",
          startDate: "2027-07-01",
          endDate: "2027-07-03",
          reason: "Test leave",
        };
        let r = await call("post", "/api/leaves/create", staff.token, body);
        assert.equal(r.status, 201, JSON.stringify(r.body));
        const id = r.body.data.id;
        leaves.push(id);
        assert.equal(
          (await call("post", "/api/leaves/create", staff.token, body)).status,
          409,
        );
        assert.equal(
          (
            await call("get", "/api/leaves/list", other.token)
          ).body.data.items.some((v) => v.id === id),
          false,
        );
        assert.equal(
          (await call("delete", `/api/leaves/delete/${id}`, other.token))
            .status,
          403,
        );
        assert.equal(
          (
            await call("patch", `/api/leaves/update/${id}`, staff.token, {
              status: "approved",
            })
          ).status,
          403,
        );
        r = await call("patch", `/api/leaves/update/${id}`, hr.token, {
          status: "approved",
          note: "Đồng ý",
        });
        assert.equal(r.status, 200, JSON.stringify(r.body));
        assert.equal(
          (
            await call("patch", `/api/leaves/update/${id}`, admin.token, {
              status: "rejected",
            })
          ).status,
          409,
        );
        assert.equal(
          (await call("delete", `/api/leaves/delete/${id}`, staff.token))
            .status,
          409,
        );
      },
    );
    await t.test(
      "Concurrent overlapping leave requests: one succeeds, one rejected",
      async () => {
        const body = {
          type: "sick",
          startDate: "2027-08-01",
          endDate: "2027-08-02",
          reason: "Concurrency",
        };
        const results = await Promise.all([
          call("post", "/api/leaves/create", other.token, body),
          call("post", "/api/leaves/create", other.token, body),
        ]);
        assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
      },
    );
    await t.test(
      "Attendance check-in/check-out once; employee list is private",
      async () => {
        assert.equal(
          (await call("post", "/api/attendance/check-out", staff.token, {}))
            .status,
          422,
        );
        assert.equal(
          (await call("post", "/api/attendance/check-in", staff.token, {}))
            .status,
          201,
        );
        assert.equal(
          (await call("post", "/api/attendance/check-in", staff.token, {}))
            .status,
          409,
        );
        assert.equal(
          (await call("post", "/api/attendance/check-out", staff.token, {}))
            .status,
          200,
        );
        assert.equal(
          (await call("post", "/api/attendance/check-out", staff.token, {}))
            .status,
          409,
        );
        const r = await call("get", "/api/attendance/list", other.token);
        assert.equal(r.body.data.items.length, 0);
      },
    );
    await t.test(
      "Dashboard cache MISS/HIT and invalidation after mutation",
      async () => {
        await invalidate();
        assert.equal(
          (await call("get", "/api/dashboard/summary", admin.token)).headers[
            "x-cache"
          ],
          "MISS",
        );
        assert.equal(
          (await call("get", "/api/dashboard/summary", admin.token)).headers[
            "x-cache"
          ],
          "HIT",
        );
        await call("put", `/api/departments/update/${dep}`, admin.token, {
          name: suffix,
          description: "Cache invalidated",
        });
        assert.equal(
          (await call("get", "/api/dashboard/summary", admin.token)).headers[
            "x-cache"
          ],
          "MISS",
        );
      },
    );
    await t.test(
      "Cookie login requires CSRF on writes; bearer clients may use API",
      async () => {
        const agent = request.agent(app),
          r = await agent.post("/api/auth/login").send({
            email: `${suffix}-0@example.test`,
            password: "StrongTest123!",
          });
        assert.equal(r.status, 200);
        assert.equal(
          (await agent.post("/api/leaves/create").send({})).status,
          403,
        );
        assert.equal(
          (
            await agent
              .post("/api/leaves/create")
              .set("X-CSRF-Token", "é".repeat(r.body.data.csrf.length))
              .send({})
          ).status,
          403,
        );
        assert.equal(
          (
            await agent
              .post("/api/leaves/create")
              .set("X-CSRF-Token", r.body.data.csrf)
              .send({})
          ).status,
          422,
        );
      },
    );
    await t.test(
      "EJS web pages return actual HTML, links and forms (Admin + employee)",
      async () => {
        for (const path of [
          "/",
          "/employees/list?departmentId=&search=",
          "/departments/list",
          "/leaves/list?status=",
          "/attendance/list",
          "/notifications/list",
          "/audit/list",
          "/system/status",
        ]) {
          const r = await call("get", path, admin.token);
          assert.equal(r.status, 200, `${path}: ${r.text.slice(0, 250)}`);
          assert.match(r.headers["content-type"], /html/);
          assert.match(r.text, /PeopleFlow/);
        }
        assert.equal((await call("get", "/", staff.token)).status, 200);
        assert.equal(
          (await call("get", "/employees/list", staff.token)).status,
          403,
        );
      },
    );
    await t.test(
      "Scheduler digest idempotency and outbox records",
      async () => {
        const a = await dailyDigest(suffix),
          b = await dailyDigest(suffix);
        assert.equal(a.created, true);
        assert.equal(b.created, false);
        // Remove only synthetic digest events produced by this test.
        const rows = await Outbox.findAll({
          where: { topic: "hr.daily-digest" },
        });
        for (const row of rows)
          if (row.payload.subject.includes(suffix)) await row.destroy();
      },
    );
    await t.test(
      "Logout revokes token; deactivation invalidates user login and API",
      async () => {
        assert.equal(
          (await call("post", "/api/auth/logout", other.token, {})).status,
          200,
        );
        assert.equal(
          (await call("get", "/api/auth/profile", other.token)).status,
          401,
        );
        assert.equal(
          (
            await call(
              "delete",
              `/api/employees/delete/${employees[0]}`,
              admin.token,
            )
          ).status,
          204,
        );
        assert.equal(
          (await call("get", "/api/auth/profile", staff.token)).status,
          401,
        );
        assert.equal(
          (
            await call("post", "/api/auth/login", null, {
              email: `${suffix}-0@example.test`,
              password: "StrongTest123!",
            })
          ).status,
          401,
        );
        assert.equal(
          (
            await call(
              "delete",
              `/api/employees/delete/${admin.user.employeeId}`,
              admin.token,
            )
          ).status,
          422,
        );
      },
    );
  } finally {
    await cleanup();
  }
});
