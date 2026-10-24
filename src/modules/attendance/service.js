// Service kiểm tra nghiệp vụ, gọi model Sequelize và giữ các thay đổi liên quan trong transaction.
import { db } from "../../lib/db.js";
import { Attendance, Employee, User } from "../../models/index.js";
import { paginationSchema } from "../../lib/validation.js";
import { HttpError } from "../../lib/http.js";
import { publish } from "../../events/index.js";
import { workDate } from "../../lib/dates.js";
export async function list(user, query) {
  const q = paginationSchema.parse(query),
    where = user.role === "employee" ? { employeeId: user.employee.id } : {};
  const result = await Attendance.findAndCountAll({
    where,
    include: {
      model: Employee,
      as: "employee",
      include: { model: User, as: "user", attributes: ["name", "email"] },
    },
    order: [["id", "DESC"]],
    limit: 10,
    offset: (q.page - 1) * 10,
  });
  return {
    items: result.rows,
    pagination: { page: q.page, perPage: 10, total: result.count },
  };
}
export async function checkIn(user) {
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
export async function checkOut(user) {
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
