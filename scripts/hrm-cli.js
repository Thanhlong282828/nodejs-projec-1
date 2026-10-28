import { loadAccess } from "../src/modules/access/access-context.js";
import { safeUser } from "../src/models/index.js";
import { createCompanyRoles } from "../src/modules/access/bootstrap.js";
import bcrypt from "bcryptjs";
import { db } from "../src/lib/db.js";
import { migrator } from "../src/lib/migrations.js";
import { User, Employee, Department, Company } from "../src/models/index.js";
import { registerObservers } from "../src/observers/audit-observer.js";
import { dispatch, closeQueue, getQueue } from "../src/queue/index.js";
import { runOnce } from "../src/scheduler-jobs.js";
import { redis } from "../src/lib/redis.js";
registerObservers();
async function seed() {
  await db.transaction(async (transaction) => {
    const company = await Company.findOne({
      where: { code: "PEOPLEFLOW" },
      transaction,
    });
    if (!company) throw new Error("Run migrate before seed");
    const companyId = company.id,
      roles = await createCompanyRoles(companyId, transaction);
    const specs = [
      ["Kỹ thuật", "Xây dựng và vận hành sản phẩm"],
      ["Nhân sự", "Phát triển con người và văn hóa"],
      ["Kinh doanh", "Kết nối khách hàng và thị trường"],
    ];
    const departments = [];
    for (const [name, description] of specs) {
      const [row] = await Department.findOrCreate({
        where: { name, companyId },
        defaults: { description },
        transaction,
        skipAudit: true,
      });
      departments.push(row);
    }
    const accounts = [
      [
        "admin@hrm.local",
        "Nguyễn Minh Anh",
        "admin",
        "HRM001",
        0,
        "Giám đốc điều hành",
        35000000,
      ],
      [
        "hr@hrm.local",
        "Trần Hoài An",
        "hr",
        "HRM002",
        1,
        "Chuyên viên nhân sự",
        18000000,
      ],
      [
        "employee@hrm.local",
        "Lê Thanh Bình",
        "employee",
        "HRM003",
        0,
        "Backend Developer",
        22000000,
      ],
      [
        "mai@hrm.local",
        "Phạm Ngọc Mai",
        "employee",
        "HRM004",
        2,
        "Chuyên viên kinh doanh",
        16000000,
      ],
      [
        "nam@hrm.local",
        "Vũ Hoàng Nam",
        "employee",
        "HRM005",
        0,
        "Software Engineer",
        24000000,
      ],
      [
        "linh@hrm.local",
        "Đỗ Khánh Linh",
        "employee",
        "HRM006",
        1,
        "Talent Acquisition",
        17000000,
      ],
    ];
    for (const [
      email,
      name,
      role,
      code,
      department,
      position,
      salary,
    ] of accounts) {
      const [user, created] = await User.findOrCreate({
        where: { email },
        defaults: {
          companyId,
          roleId: roles[role].id,
          name,
          role,
          password: await bcrypt.hash("HrmDemo123!", 12),
          active: true,
        },
        transaction,
      });
      if (created)
        await Employee.create(
          {
            companyId,
            code,
            userId: user.id,
            departmentId: departments[department].id,
            position,
            salary,
            phone: "",
            joinedOn: "2026-10-01",
            status: "active",
          },
          { transaction, skipAudit: true },
        );
    }
  });
  console.log(
    "Seed ready. Demo only: admin@hrm.local / hr@hrm.local / employee@hrm.local; password HrmDemo123! (existing accounts preserved).",
  );
}
const command = process.argv[2] || "help";
try {
  if (command === "route:list") {
    const { app } = await import("../src/app.js");
    const { listRoutes } = await import("../src/core/route-list.js");
    console.table(listRoutes(app));
  } else if (command === "access:list") {
    const rows = [];
    for (const user of await User.findAll({
      order: [
        ["companyId", "ASC"],
        ["id", "ASC"],
      ],
    })) {
      await loadAccess(user);
      const item = safeUser(user);
      rows.push({
        id: item.id,
        email: item.email,
        companyId: item.companyId,
        company: item.company?.name,
        roleId: item.roleId,
        role: item.roleName,
        permissions: item.permissions.join(", "),
      });
    }
    console.log(
      "Application permissions stored in MySQL database:",
      db.config.database,
    );
    console.table(rows);
  } else if (command === "migrate") await migrator.up();
  else if (command === "migrations")
    console.log({
      executed: (await migrator.executed()).map((v) => v.name),
      pending: (await migrator.pending()).map((v) => v.name),
    });
  else if (command === "undo") {
    if (!process.argv.includes("--confirm-data-loss"))
      throw new Error(
        "Rollback drops HRM tables. Add --confirm-data-loss only for disposable database.",
      );
    await migrator.down();
  } else if (command === "seed") await seed();
  else if (command === "dispatch")
    console.log({ dispatched: await dispatch() });
  else if (command === "schedule:run") console.log(await runOnce());
  else if (command === "queue:failed") {
    console.table(
      (await getQueue().getFailed(0, 49)).map((job) => ({
        id: job.id,
        attempts: job.attemptsMade,
        reason: job.failedReason,
      })),
    );
  } else if (command === "queue:retry") {
    const job = await getQueue().getJob(process.argv[3] || "");
    if (!job || (await job.getState()) !== "failed")
      throw new Error("Provide an existing failed job ID");
    await job.retry();
    console.log("Job queued again:", job.id);
  } else if (command === "users")
    console.table(
      (
        await User.findAll({
          attributes: ["id", "name", "email", "role", "active"],
        })
      ).map((u) => u.toJSON()),
    );
  else
    console.log(
      "Commands: route:list | access:list | migrate | migrations | seed | users | dispatch | queue:failed | queue:retry JOB_ID | schedule:run | undo --confirm-data-loss",
    );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await closeQueue();
  redis.disconnect();
  await db.close();
}
