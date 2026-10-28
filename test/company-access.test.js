import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { Op } from "sequelize";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";
import { io as client } from "socket.io-client";
import { createHttpServer } from "../src/server.js";
import { app } from "../src/app.js";
import { db } from "../src/lib/db.js";
import { redis, invalidate } from "../src/lib/redis.js";
import { closeQueue, getQueue } from "../src/queue/index.js";
import {
  Company,
  User,
  Employee,
  Department,
  Leave,
  Attendance,
  Audit,
  Outbox,
  Role,
  RolePermission,
  Permission,
  UserPermission,
} from "../src/models/index.js";
import { dailyDigest } from "../src/scheduler-jobs.js";
import { DailyRun } from "../src/models/index.js";
const suffix = `rbac-${Date.now()}`;
const call = (method, url, token, body) => {
  const r = request(app)[method](url);
  if (token) r.set("Authorization", `Bearer ${token}`);
  return body ? r.send(body) : r;
};
async function login(email, password = "HrmDemo123!") {
  const r = await call("post", "/api/auth/login", null, { email, password });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  return r.body.data;
}
const check = (r, status) =>
  assert.equal(r.status, status, JSON.stringify(r.body));
const spec = (email, code, departmentId) => ({
  name: "RBAC Test",
  email,
  code,
  departmentId,
  password: "StrongTest123!",
  position: "Backend Junior",
  joinedOn: "2026-10-01",
  salary: 12000000,
  status: "active",
  role: "employee",
});
let tenant,
  roleId,
  aUser,
  aEmployee,
  aDep,
  bDep,
  bEmployee,
  admin,
  otherAdmin,
  staff,
  otherStaff,
  server,
  io;
const sockets = [];
async function cleanup() {
  for (const socket of sockets) socket.disconnect();
  if (io) await new Promise((resolve) => io.close(resolve));
  if (server?.listening) await new Promise((resolve) => server.close(resolve));
  const userIds = [
    aUser,
    ...(tenant
      ? (
          await User.findAll({
            where: { companyId: tenant },
            attributes: ["id"],
          })
        ).map((u) => u.id)
      : []),
  ].filter(Boolean);
  const employeeIds = [aEmployee, bEmployee].filter(Boolean);
  if (userIds.length) {
    for (const row of await Outbox.findAll())
      if (
        userIds.includes(row.payload.userId) ||
        row.payload.subject?.includes(suffix)
      )
        await row.destroy();
    await UserPermission.destroy({ where: { userId: userIds } });
  }
  if (employeeIds.length) {
    await Attendance.destroy({ where: { employeeId: employeeIds } });
    await Leave.destroy({ where: { employeeId: employeeIds } });
    await Employee.destroy({ where: { id: employeeIds }, hooks: false });
  }
  await Audit.destroy({
    where: {
      [Op.or]: [
        { actorId: userIds },
        { entity: "Employee", entityId: employeeIds },
        ...(tenant ? [{ companyId: tenant }] : []),
        ...(aDep ? [{ entity: "Department", entityId: aDep }] : []),
        ...(roleId ? [{ entity: "Role", entityId: roleId }] : []),
        ...(aUser ? [{ entity: "UserAccess", entityId: aUser }] : []),
      ],
    },
  });
  if (userIds.length) await User.destroy({ where: { id: userIds } });
  if (aDep) await Department.destroy({ where: { id: aDep }, hooks: false });
  if (tenant)
    await Department.destroy({ where: { companyId: tenant }, hooks: false });
  const roleIds = [
    roleId,
    ...(tenant
      ? (await Role.findAll({ where: { companyId: tenant } })).map((r) => r.id)
      : []),
  ].filter(Boolean);
  if (roleIds.length) {
    await RolePermission.destroy({ where: { roleId: roleIds } });
    await Role.destroy({ where: { id: roleIds } });
  }
  if (tenant) await Company.destroy({ where: { id: tenant } });
  await DailyRun.destroy({ where: { id: `hr-digest-${suffix}` } });
  await invalidate();
  await closeQueue();
  redis.disconnect();
  await db.close();
}
test(
  "MySQL companies and dynamic permissions integration",
  { timeout: 30000 },
  async (t) => {
    try {
      admin = await login("admin@hrm.local");
      await t.test(
        "Existing accounts migrated into MySQL company/roles with concrete permissions",
        async () => {
          assert.ok(admin.user.companyId);
          assert.ok(admin.user.roleId);
          assert.ok(admin.user.permissions.includes("access.manage"));
          const [rows] = await db.query(
            "SELECT u.email,c.code,r.code AS role_code,COUNT(rp.permission_id) AS permission_count FROM hrm_users u JOIN hrm_companies c ON c.id=u.company_id JOIN hrm_roles r ON r.id=u.role_id LEFT JOIN hrm_role_permissions rp ON rp.role_id=r.id GROUP BY u.id,c.code,r.code",
          );
          assert.ok(
            rows.find((r) => r.email === "admin@hrm.local").permission_count >
              0,
          );
          assert.ok(
            rows.find((r) => r.email === "employee@hrm.local")
              .permission_count > 0,
          );
        },
      );
      await t.test(
        "Create second company with independent administrator and seeded MySQL roles",
        async () => {
          const r = await call("post", "/api/companies/create", admin.token, {
            name: suffix,
            code: suffix.toUpperCase(),
            email: `company-${suffix}@example.test`,
            adminName: "Second admin",
            adminEmail: `admin-${suffix}@example.test`,
            adminPassword: "StrongTest123!",
          });
          check(r, 201);
          tenant = r.body.data.id;
          otherAdmin = await login(
            `admin-${suffix}@example.test`,
            "StrongTest123!",
          );
          assert.equal(otherAdmin.user.companyId, tenant);
          assert.notEqual(otherAdmin.user.roleId, admin.user.roleId);
          const a = await call("post", "/api/departments/create", admin.token, {
            name: suffix,
          });
          check(a, 201);
          aDep = a.body.data.id;
          const b = await call(
            "post",
            "/api/departments/create",
            otherAdmin.token,
            { name: suffix },
          );
          check(b, 201);
          bDep = b.body.data.id;
          // identical employee codes and department names are allowed across companies.
          const x = await call(
            "post",
            "/api/employees/create",
            admin.token,
            spec(`a-${suffix}@example.test`, suffix, aDep),
          );
          check(x, 201);
          aUser = x.body.data.userId;
          aEmployee = x.body.data.id;
          const y = await call(
            "post",
            "/api/employees/create",
            otherAdmin.token,
            spec(`b-${suffix}@example.test`, suffix, bDep),
          );
          check(y, 201);
          bEmployee = y.body.data.id;
          staff = await login(`a-${suffix}@example.test`, "StrongTest123!");
          otherStaff = await login(
            `b-${suffix}@example.test`,
            "StrongTest123!",
          );
        },
      );
      await t.test(
        "Lists/search/dashboard/audit and notifications are isolated by authenticated company",
        async () => {
          const a = await call(
            "get",
            `/api/employees/list?search=${suffix}&companyId=${tenant}`,
            admin.token,
          );
          check(a, 200);
          assert.deepEqual(
            a.body.data.items.map((v) => v.id),
            [aEmployee],
          );
          const b = await call(
            "get",
            "/api/departments/list",
            otherAdmin.token,
          );
          assert.deepEqual(
            b.body.data.map((v) => v.id),
            [bDep],
          );
          const c = await call(
            "get",
            "/api/dashboard/summary",
            otherAdmin.token,
          );
          check(c, 200);
          assert.equal(c.body.data.employees, 1);
          assert.equal(c.body.data.departments, 1);
          const audit = await call("get", "/api/audit/list", otherAdmin.token);
          assert.ok(audit.body.data.items.every((v) => v.companyId === tenant));
          check(
            await call(
              "get",
              `/api/companies/detail/${admin.user.companyId}`,
              otherAdmin.token,
            ),
            404,
          );
          const list = await call(
            "get",
            "/api/companies/list",
            otherAdmin.token,
          );
          assert.deepEqual(
            list.body.data.map((v) => v.id),
            [tenant],
          );
        },
      );
      await t.test(
        "System queue metrics count only jobs of the current company",
        async () => {
          const a = await call("get", "/api/system/status", admin.token),
            b = await call("get", "/api/system/status", otherAdmin.token);
          check(a, 200);
          check(b, 200);
          assert.equal(a.body.data.queue.unavailable, undefined);
          const job = await getQueue().add(
            "rbac-delayed-test",
            { companyId: tenant },
            { jobId: `queue-${suffix}`, delay: 3600000 },
          );
          try {
            const a2 = await call("get", "/api/system/status", admin.token),
              b2 = await call("get", "/api/system/status", otherAdmin.token);
            check(a2, 200);
            check(b2, 200);
            assert.equal(a2.body.data.queue.delayed, a.body.data.queue.delayed);
            assert.equal(
              b2.body.data.queue.delayed,
              b.body.data.queue.delayed + 1,
            );
          } finally {
            await job.remove();
          }
        },
      );
      await t.test(
        "Cross-company detail/write/foreign department/role assignment are rejected",
        async () => {
          check(
            await call(
              "get",
              `/api/employees/detail/${aEmployee}`,
              otherAdmin.token,
            ),
            404,
          );
          check(
            await call(
              "put",
              `/api/employees/update/${aEmployee}`,
              otherAdmin.token,
              spec(`a-${suffix}@example.test`, suffix, aDep),
            ),
            404,
          );
          check(
            await call(
              "delete",
              `/api/employees/delete/${aEmployee}`,
              otherAdmin.token,
            ),
            404,
          );
          check(
            await call(
              "delete",
              `/api/departments/delete/${aDep}`,
              otherAdmin.token,
            ),
            404,
          );
          check(
            await call(
              "post",
              "/api/employees/create",
              otherAdmin.token,
              spec(`invalid-${suffix}@example.test`, "invalid", aDep),
            ),
            422,
          );
          assert.equal(
            await User.count({
              where: { email: `invalid-${suffix}@example.test` },
            }),
            0,
          );
          check(
            await call(
              "put",
              `/api/accounts/assign/${aUser}`,
              otherAdmin.token,
              {
                roleId: otherStaff.user.roleId,
              },
            ),
            404,
          );
          check(
            await call("put", `/api/accounts/assign/${aUser}`, admin.token, {
              roleId: otherStaff.user.roleId,
            }),
            422,
          );
          await assert.rejects(
            db.query(
              "UPDATE hrm_employees SET department_id=:departmentId WHERE id=:id",
              { replacements: { departmentId: bDep, id: aEmployee } },
            ),
            (e) => e.name === "SequelizeForeignKeyConstraintError",
          );
        },
      );
      let leaveId;
      await t.test(
        "Leave and attendance ownership plus company boundaries hold for privileged accounts",
        async () => {
          const r = await call("post", "/api/leaves/create", otherStaff.token, {
            type: "annual",
            startDate: "2028-01-01",
            endDate: "2028-01-02",
            reason: "tenant test",
          });
          check(r, 201);
          leaveId = r.body.data.id;
          const leaves = await call("get", "/api/leaves/list", admin.token);
          assert.ok(!leaves.body.data.items.some((v) => v.id === leaveId));
          check(
            await call("patch", `/api/leaves/update/${leaveId}`, admin.token, {
              status: "approved",
            }),
            404,
          );
          check(
            await call("delete", `/api/leaves/delete/${leaveId}`, staff.token),
            404,
          );
          check(
            await call(
              "post",
              "/api/attendance/check-in",
              otherStaff.token,
              {},
            ),
            201,
          );
          const attendance = await call(
            "get",
            "/api/attendance/list",
            admin.token,
          );
          assert.ok(
            !attendance.body.data.items.some((v) => v.employeeId === bEmployee),
          );
        },
      );
      await t.test(
        "HR cannot reset an account whose DB role has permissions beyond HR",
        async () => {
          const hr = await login("hr@hrm.local");
          const permission = await Permission.findOne({
            where: { key: "system.view" },
          });
          const grant = await RolePermission.create({
            roleId: staff.user.roleId,
            permissionId: permission.id,
          });
          try {
            check(
              await call(
                "put",
                `/api/employees/update/${aEmployee}`,
                hr.token,
                spec(`a-${suffix}@example.test`, suffix, aDep),
              ),
              403,
            );
          } finally {
            await grant.destroy();
          }
        },
      );
      const rolePermissions = [
        "dashboard.view",
        "departments.view",
        "leaves.view",
        "leaves.create",
        "leaves.delete",
        "attendance.view",
        "attendance.checkIn",
        "attendance.checkOut",
        "employees.view",
      ];
      await t.test(
        "Create custom role in MySQL and assign to account; revoke old JWT",
        async () => {
          check(await call("get", "/api/employees/list", staff.token), 403);
          const r = await call("post", "/api/roles/create", admin.token, {
            name: "Test team lead",
            code: suffix,
            permissions: rolePermissions,
          });
          check(r, 201);
          roleId = r.body.data.id;
          assert.equal(
            await RolePermission.count({ where: { roleId } }),
            rolePermissions.length,
          );
          check(
            await call("put", `/api/accounts/assign/${aUser}`, admin.token, {
              roleId,
            }),
            200,
          );
          check(await call("get", "/api/auth/profile", staff.token), 401);
          staff = await login(`a-${suffix}@example.test`, "StrongTest123!");
          check(await call("get", "/api/employees/list", staff.token), 200);
          check(
            await call("post", "/api/employees/create", staff.token, {}),
            403,
          );
          check(await call("get", "/access/list", staff.token), 403);
        },
      );
      await t.test(
        "Per-account allow/deny persist in MySQL; deny overrides inherited role permission",
        async () => {
          check(
            await call("put", `/api/accounts/assign/${aUser}`, admin.token, {
              roleId,
              allow: ["departments.create"],
              deny: ["employees.view"],
            }),
            200,
          );
          staff = await login(`a-${suffix}@example.test`, "StrongTest123!");
          assert.ok(staff.user.permissions.includes("departments.create"));
          assert.ok(!staff.user.permissions.includes("employees.view"));
          check(await call("get", "/api/employees/list", staff.token), 403);
          assert.equal(
            await UserPermission.count({ where: { userId: aUser } }),
            2,
          );
          const department = await call(
            "post",
            "/api/departments/create",
            staff.token,
            { name: `grant-${suffix}` },
          );
          check(department, 201);
          await Audit.destroy({
            where: { entity: "Department", entityId: department.body.data.id },
          });
          await Department.destroy({
            where: { id: department.body.data.id },
            hooks: false,
          });
          const html = await call("get", "/", staff.token);
          check(html, 200);
          assert.ok(!html.text.includes('href="/employees/list"'));
        },
      );
      await t.test(
        "Direct MySQL permission change affects next request with same JWT, without restart",
        async () => {
          const permission = await Permission.findOne({
            where: { key: "employees.view" },
          });
          await db.query(
            "UPDATE hrm_user_permissions SET allowed=1 WHERE user_id=:userId AND permission_id=:permissionId",
            { replacements: { userId: aUser, permissionId: permission.id } },
          );
          check(await call("get", "/api/employees/list", staff.token), 200);
          await db.query(
            "UPDATE hrm_user_permissions SET allowed=0 WHERE user_id=:userId AND permission_id=:permissionId",
            { replacements: { userId: aUser, permissionId: permission.id } },
          );
          check(await call("get", "/api/employees/list", staff.token), 403);
        },
      );
      await t.test(
        "Role edits revoke member sessions; validation and protected admin guards",
        async () => {
          check(
            await call("put", `/api/roles/update/${roleId}`, admin.token, {
              name: "Updated lead",
              code: suffix,
              permissions: rolePermissions,
            }),
            200,
          );
          check(await call("get", "/api/auth/profile", staff.token), 401);
          staff = await login(`a-${suffix}@example.test`, "StrongTest123!");
          check(
            await call("post", "/api/roles/create", admin.token, {
              name: "Bad",
              code: `bad-${suffix}`,
              permissions: ["nonexistent.permission"],
            }),
            422,
          );
          check(
            await call("put", `/api/accounts/assign/${aUser}`, admin.token, {
              roleId,
              allow: ["employees.view"],
              deny: ["employees.view"],
            }),
            422,
          );
          check(
            await call(
              "put",
              `/api/accounts/assign/${admin.user.id}`,
              admin.token,
              { roleId },
            ),
            422,
          );
          check(
            await call(
              "put",
              `/api/roles/update/${admin.user.roleId}`,
              admin.token,
              { name: "bad", code: "admin", permissions: [] },
            ),
            422,
          );
          check(
            await call("put", `/api/roles/update/${roleId}`, otherAdmin.token, {
              name: "bad",
              code: suffix,
              permissions: [],
            }),
            404,
          );
        },
      );
      await t.test(
        "EJS company/access pages and read-only employee views are real HTML with forms",
        async () => {
          for (const path of ["/companies/list", "/access/list"]) {
            const r = await call("get", path, admin.token);
            check(r, 200);
            assert.match(r.headers["content-type"], /html/);
            assert.match(r.text, /data-api=/);
          }
          const permission = await Permission.findOne({
            where: { key: "employees.view" },
          });
          await UserPermission.destroy({
            where: { userId: aUser, permissionId: permission.id },
          });
          const r = await call("get", "/employees/list", staff.token);
          check(r, 200);
          assert.ok(!r.text.includes('data-open="employee-dialog"'));
          assert.ok(!r.text.includes("data-edit-employee="));
        },
      );
      await t.test(
        "Realtime emits only inside matching company and reevaluates revoked MySQL permission",
        async () => {
          ({ server, io } = createHttpServer());
          server.listen(0, "127.0.0.1");
          await once(server, "listening");
          const url = `http://127.0.0.1:${server.address().port}`;
          const a = client(url, {
            auth: { token: admin.token },
            transports: ["websocket"],
            reconnection: false,
          });
          const b = client(url, {
            auth: { token: otherAdmin.token },
            transports: ["websocket"],
            reconnection: false,
          });
          const c = client(url, {
            auth: { token: staff.token },
            transports: ["websocket"],
            reconnection: false,
          });
          sockets.push(a, b, c);
          await Promise.all([
            once(a, "connect"),
            once(b, "connect"),
            once(c, "connect"),
          ]);
          const bEvents = [],
            cEvents = [];
          b.on("hrm:changed", (v) => bEvents.push(v));
          c.on("hrm:changed", (v) => cEvents.push(v));
          const { publish } = await import("../src/events/index.js");
          const got = once(a, "hrm:changed");
          await publish({
            companyId: admin.user.companyId,
            topic: "employee.updated",
          });
          assert.equal((await got)[0].topic, "employee.updated");
          await delay(200);
          assert.equal(bEvents.length, 0);
          assert.equal(cEvents.length, 1);
          const permission = await Permission.findOne({
            where: { key: "employees.view" },
          });
          await UserPermission.create({
            userId: aUser,
            permissionId: permission.id,
            allowed: false,
          });
          await publish({
            companyId: admin.user.companyId,
            topic: "employee.updated",
          });
          await delay(200);
          assert.equal(cEvents.length, 1);
          assert.equal(bEvents.length, 0);
        },
      );
      await t.test(
        "Scheduler digest count and recipients remain scoped per company",
        async () => {
          await dailyDigest(suffix);
          const events = await Outbox.findAll({
            where: { topic: "hr.daily-digest" },
          });
          const scoped = events.filter((v) =>
            v.payload.subject.includes(suffix),
          );
          const b = scoped.filter((v) => v.payload.companyId === tenant);
          assert.equal(b.length, 1);
          assert.equal(b[0].payload.userId, otherAdmin.user.id);
          assert.match(b[0].payload.text, /1 đơn nghỉ/);
          for (const row of scoped) await row.destroy();
        },
      );
    } finally {
      await cleanup();
    }
  },
);
