// Command Handler: nghiệp vụ ghi + transaction + observer/outbox, tương tự DJI.
import { db } from "../../../lib/db.js";
import { Attendance } from "../../../models/index.js";
import { HttpError } from "../../../lib/http.js";
import { publish } from "../../../events/index.js";
import { workDate } from "../../../lib/dates.js";
async function checkIn(user) {
  if (!user.employee) throw new HttpError(422, "Chưa có hồ sơ nhân viên.");
  const row = await db.transaction((transaction) =>
    Attendance.create(
      {
        employeeId: user.employee.id,
        workDate: workDate(),
        checkIn: new Date(),
      },
      { transaction, actorId: user.id },
    ),
  );
  await publish({ topic: "attendance.checked-in", employeeUserId: user.id });
  return row;
}
async function checkOut(user) {
  if (!user.employee) throw new HttpError(422, "Chưa có hồ sơ nhân viên.");
  const row = await db.transaction(async (transaction) => {
    const attendance = await Attendance.findOne({
      where: { employeeId: user.employee.id, workDate: workDate() },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!attendance) throw new HttpError(422, "Bạn chưa check-in hôm nay.");
    if (attendance.checkOut)
      throw new HttpError(409, "Bạn đã check-out hôm nay.");
    return attendance.update(
      { checkOut: new Date() },
      { transaction, actorId: user.id },
    );
  });
  await publish({ topic: "attendance.checked-out", employeeUserId: user.id });
  return row;
}

export class CheckInCommand {
  constructor(actor) {
    this.actor = actor;
    Object.freeze(this);
  }
}
export class CheckOutCommand {
  constructor(actor) {
    this.actor = actor;
    Object.freeze(this);
  }
}
export const commandHandlers = [
  [CheckInCommand, ({ actor }) => checkIn(actor)],
  [CheckOutCommand, ({ actor }) => checkOut(actor)],
];
