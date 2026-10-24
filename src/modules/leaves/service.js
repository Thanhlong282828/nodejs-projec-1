// Service kiểm tra nghiệp vụ, gọi model Sequelize và giữ các thay đổi liên quan trong transaction.
import { Op } from "sequelize";
import { db } from "../../lib/db.js";
import { Employee, User, Leave, Department } from "../../models/index.js";
import {
  leaveSchema,
  decisionSchema,
  paginationSchema,
  parseId,
} from "../../lib/validation.js";
import { HttpError } from "../../lib/http.js";
import { recordEvent, publish } from "../../events/index.js";
const include = [
  {
    model: Employee,
    as: "employee",
    include: [
      { model: User, as: "user", attributes: ["id", "name", "email"] },
      { model: Department, as: "department" },
    ],
  },
  { model: User, as: "reviewer", attributes: ["id", "name"] },
];
export async function list(user, query) {
  const q = paginationSchema.parse(query),
    where = {};
  if (user.role === "employee") where.employeeId = user.employee.id;
  if (q.status) where.status = q.status;
  const result = await Leave.findAndCountAll({
    where,
    include,
    order: [["id", "DESC"]],
    limit: 10,
    offset: (q.page - 1) * 10,
  });
  return {
    items: result.rows,
    pagination: { page: q.page, perPage: 10, total: result.count },
  };
}
export async function create(user, input) {
  const values = leaveSchema.parse(input);
  if (!user.employee)
    throw new HttpError(422, "Tài khoản chưa có hồ sơ nhân viên.");
  let result;
  await db.transaction(async (transaction) => {
    // Khóa employee để hai request đồng thời không cùng tạo đơn trùng khoảng ngày.
    await Employee.findByPk(user.employee.id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    const overlap = await Leave.count({
      where: {
        employeeId: user.employee.id,
        status: { [Op.in]: ["pending", "approved"] },
        startDate: { [Op.lte]: values.endDate },
        endDate: { [Op.gte]: values.startDate },
      },
      transaction,
    });
    if (overlap)
      throw new HttpError(
        409,
        "Khoảng ngày đã có đơn nghỉ chờ duyệt hoặc được duyệt.",
      );
    result = await Leave.create(
      { ...values, employeeId: user.employee.id },
      { transaction, actorId: user.id },
    );
    const managers = await User.findAll({
      where: { role: { [Op.in]: ["admin", "hr"] }, active: true },
      transaction,
    });
    for (const manager of managers)
      await recordEvent(
        "leave.requested",
        {
          recipient: manager.email,
          subject: "Đơn nghỉ phép mới",
          text: `${user.name} xin nghỉ từ ${values.startDate} đến ${values.endDate}. Vui lòng mở HRM để xem và duyệt.`,
          userId: manager.id,
        },
        transaction,
      );
  });
  await publish({ topic: "leave.requested", employeeUserId: user.id });
  return result;
}
export async function decide(actor, id, input) {
  const values = decisionSchema.parse(input);
  let employeeUserId, result;
  await db.transaction(async (transaction) => {
    const row = await Leave.findByPk(parseId(id), {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!row) throw new HttpError(404, "Không tìm thấy đơn nghỉ.");
    const employee = await Employee.findByPk(row.employeeId, { transaction });
    if (employee.userId === actor.id)
      throw new HttpError(403, "Không được tự duyệt đơn nghỉ của mình.");
    if (row.status !== "pending")
      throw new HttpError(409, "Đơn nghỉ đã được xử lý.");
    result = await row.update(
      { ...values, reviewedBy: actor.id },
      { transaction, actorId: actor.id },
    );
    const user = await User.findByPk(employee.userId, { transaction });
    employeeUserId = user.id;
    await recordEvent(
      "leave.decided",
      {
        recipient: user.email,
        subject: "Kết quả đơn nghỉ phép",
        text: `Đơn nghỉ từ ${row.startDate} đến ${row.endDate}: ${values.status === "approved" ? "được duyệt" : "bị từ chối"}. Ghi chú: ${values.note}`,
        userId: user.id,
      },
      transaction,
    );
  });
  await publish({ topic: "leave.decided", employeeUserId });
  return result;
}
export async function remove(user, id) {
  let employeeUserId;
  await db.transaction(async (transaction) => {
    const row = await Leave.findByPk(parseId(id), {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!row) throw new HttpError(404, "Không tìm thấy đơn nghỉ.");
    const employee = await Employee.findByPk(row.employeeId, { transaction });
    if (employee.userId !== user.id)
      throw new HttpError(403, "Chỉ được hủy đơn nghỉ của chính bạn.");
    if (row.status !== "pending")
      throw new HttpError(409, "Chỉ được hủy đơn đang chờ duyệt.");
    employeeUserId = user.id;
    await row.destroy({ transaction, actorId: user.id });
  });
  await publish({ topic: "leave.cancelled", employeeUserId });
}
