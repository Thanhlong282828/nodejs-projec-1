import { loadAccess } from "../../access/access-context.js";
import { companyWhere } from "../../../core/tenant.js";
import { can } from "../../access/permissions.js";
// Command Handler: nghiệp vụ ghi + transaction + observer/outbox, tương tự DJI.
import { Op } from "sequelize";
import { db } from "../../../lib/db.js";
import { Employee, User, Leave } from "../../../models/index.js";
import { leaveSchema, decisionSchema } from "../requests/LeaveRequest.js";
import { parseId } from "../../../lib/validation.js";
import { HttpError } from "../../../lib/http.js";
import { recordEvent, publish } from "../../../events/index.js";
async function create(user, input) {
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
      { ...values, ...companyWhere(user), employeeId: user.employee.id },
      { transaction, actorId: user.id },
    );
    const managers = await User.findAll({
      where: { ...companyWhere(user), active: true },
      transaction,
    });
    for (const manager of managers) {
      if (!(await loadAccess(manager)) || !can(manager, "leaves.update"))
        continue;
      await recordEvent(
        "leave.requested",
        {
          recipient: manager.email,
          subject: "Đơn nghỉ phép mới",
          text: `${user.name} xin nghỉ từ ${values.startDate} đến ${values.endDate}. Vui lòng mở HRM để xem và duyệt.`,
          companyId: user.companyId,
          userId: manager.id,
        },
        transaction,
      );
    }
  });
  await publish({
    companyId: user.companyId,
    topic: "leave.requested",
    employeeUserId: user.id,
  });
  return result;
}
async function decide(actor, id, input) {
  const values = decisionSchema.parse(input);
  let employeeUserId, result;
  await db.transaction(async (transaction) => {
    const row = await Leave.findOne({
      where: { id: parseId(id), ...companyWhere(actor) },
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
        companyId: actor.companyId,
        userId: user.id,
      },
      transaction,
    );
  });
  await publish({
    companyId: actor.companyId,
    topic: "leave.decided",
    employeeUserId,
  });
  return result;
}
async function remove(user, id) {
  let employeeUserId;
  await db.transaction(async (transaction) => {
    const row = await Leave.findOne({
      where: { id: parseId(id), ...companyWhere(user) },
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
  await publish({
    companyId: user.companyId,
    topic: "leave.cancelled",
    employeeUserId,
  });
}

export class CreateLeaveCommand {
  constructor(actor, input) {
    this.actor = actor;
    this.input = input;
    Object.freeze(this);
  }
}
export class DecideLeaveCommand {
  constructor(actor, id, input) {
    this.actor = actor;
    this.id = id;
    this.input = input;
    Object.freeze(this);
  }
}
export class DeleteLeaveCommand {
  constructor(actor, id) {
    this.actor = actor;
    this.id = id;
    Object.freeze(this);
  }
}
export const commandHandlers = [
  [CreateLeaveCommand, ({ actor, input }) => create(actor, input)],
  [DecideLeaveCommand, ({ actor, id, input }) => decide(actor, id, input)],
  [DeleteLeaveCommand, ({ actor, id }) => remove(actor, id)],
];
