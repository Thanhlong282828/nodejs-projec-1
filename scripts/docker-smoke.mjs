// Kiểm thử HTTP nội bộ trong Docker, không điều khiển hoặc chụp ảnh trình duyệt.
import assert from "node:assert/strict";
import { db } from "../src/lib/db.js";
const base = "http://web";
try {
  const health = await fetch(`${base}/health`);
  assert.equal(health.status, 200);
  const login = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: process.env.APP_ORIGIN,
    },
    body: JSON.stringify({ email: "admin@hrm.local", password: "HrmDemo123!" }),
  });
  assert.equal(login.status, 200);
  const auth = (await login.json()).data;
  const cookie = login.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join(";");
  for (const path of [
    "/",
    "/employees",
    "/departments",
    "/leaves",
    "/attendance",
    "/notifications",
    "/audit",
    "/system",
  ]) {
    const r = await fetch(base + path, { headers: { cookie } });
    assert.equal(r.status, 200, path);
    assert.match(await r.text(), /PeopleFlow/);
  }
  for (const path of [
    "/css/app.css",
    "/js/app.js",
    "/socket.io/socket.io.js",
  ]) {
    const r = await fetch(base + path);
    assert.equal(r.status, 200, path);
  }
  const me = await fetch(`${base}/api/auth/me`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  assert.equal((await me.json()).data.role, "admin");
  const socket = await fetch(`${base}/socket.io/?EIO=4&transport=polling`, {
    headers: { Origin: process.env.APP_ORIGIN },
  });
  assert.equal(socket.status, 200);
  assert.match(await socket.text(), /^0\{/);
  const service = await fetch("http://notifications:3058/health");
  assert.equal(service.status, 200);
  const unauthorized = await fetch(
    "http://notifications:3058/internal/messages?userId=1",
  );
  assert.equal(unauthorized.status, 401);
  let denied = false;
  try {
    await db.query(
      "SELECT COUNT(*) FROM week7_hrm_notifications.notification_messages",
    );
  } catch (error) {
    denied = error.original?.code === "ER_TABLEACCESS_DENIED_ERROR";
  }
  assert.equal(denied, true, "Core DB user cannot read notification DB");
  console.log(
    "DOCKER SMOKE PASSED: Nginx → login cookie → 8 HTML pages → static assets → REST → Socket.IO transport → notification service → isolated DB permissions",
  );
} finally {
  await db.close();
}
