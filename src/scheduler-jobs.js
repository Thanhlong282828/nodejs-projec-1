import { db } from "./lib/db.js";
import { DailyRun, Leave, User, Company } from "./models/index.js";
import { recordEvent } from "./events/index.js";
import { dispatch } from "./queue/index.js";
import { workDate } from "./lib/dates.js";
import { loadAccess } from "./modules/access/access-context.js";
import { can } from "./modules/access/permissions.js";
export async function dailyDigest(date = workDate()) {
  try {
    return await db.transaction(async (transaction) => {
      await DailyRun.create({ id: `hr-digest-${date}` }, { transaction });
      let pending = 0,
        recipients = 0;
      for (const company of await Company.findAll({ transaction })) {
        const companyPending = await Leave.count({
          where: { companyId: company.id, status: "pending" },
          transaction,
        });
        pending += companyPending;
        for (const user of await User.findAll({
          where: { companyId: company.id, active: true },
          transaction,
        })) {
          if (!(await loadAccess(user)) || !can(user, "leaves.update"))
            continue;
          await recordEvent(
            "hr.daily-digest",
            {
              companyId: company.id,
              recipient: user.email,
              userId: user.id,
              subject: `Tổng hợp nhân sự ${date}`,
              text: `Công ty ${company.name}: ${companyPending} đơn nghỉ chờ duyệt.`,
            },
            transaction,
          );
          recipients++;
        }
      }
      return { created: true, pending, recipients };
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError")
      return { created: false, reason: "already-ran" };
    throw error;
  }
}
export async function runOnce() {
  return { digest: await dailyDigest(), dispatched: await dispatch() };
}
