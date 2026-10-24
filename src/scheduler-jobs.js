import { Op } from "sequelize";
import { db } from "./lib/db.js";
import { DailyRun, Leave, User } from "./models/index.js";
import { recordEvent } from "./events/index.js";
import { dispatch } from "./queue/index.js";
import { workDate } from "./lib/dates.js";
// Unique key theo ngày làm cho daily digest chỉ được ghi outbox một lần/ngày dù có nhiều scheduler.
export async function dailyDigest(date = workDate()) {
  try {
    return await db.transaction(async (transaction) => {
      await DailyRun.create({ id: `hr-digest-${date}` }, { transaction });
      const pending = await Leave.count({
        where: { status: "pending" },
        transaction,
      });
      const managers = await User.findAll({
        where: { role: { [Op.in]: ["admin", "hr"] }, active: true },
        transaction,
      });
      for (const user of managers)
        await recordEvent(
          "hr.daily-digest",
          {
            recipient: user.email,
            userId: user.id,
            subject: `Tổng hợp nhân sự ${date}`,
            text: `Hiện có ${pending} đơn nghỉ phép chờ duyệt. Vui lòng mở HRM để xử lý.`,
          },
          transaction,
        );
      return { created: true, pending, recipients: managers.length };
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError")
      return { created: false, reason: "already-ran" };
    throw error;
  }
}
export async function runOnce() {
  const digest = await dailyDigest();
  const dispatched = await dispatch();
  return { digest, dispatched };
}
