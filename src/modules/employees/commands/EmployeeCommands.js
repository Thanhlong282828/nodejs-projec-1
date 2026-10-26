// Command Handler: nghiệp vụ ghi + transaction + observer/outbox, tương tự DJI.
import bcrypt from "bcryptjs";
import { db } from "../../../lib/db.js";
import { User, Employee } from "../../../models/index.js";
import {
  employeeSchema,
  employeeUpdateSchema,
} from "../requests/EmployeeRequest.js";
import { parseId } from "../../../lib/validation.js";
import { HttpError } from "../../../lib/http.js";
import { recordEvent, publish } from "../../../events/index.js";
import { get } from "../repositories/EmployeeReadRepository.js";
function checkRole(actor, input) {
  if (actor.role !== "admin" && input.role !== "employee")
    throw new HttpError(403, "Chỉ Admin được cấp quyền HR hoặc Admin.");
}
// Transaction giữ user, employee, audit và outbox cùng thành công hoặc cùng rollback.
async function create(actor, input) {
  const values = employeeSchema.parse(input);
  checkRole(actor, values);
  const id = await db.transaction(async (transaction) => {
    const user = await User.create(
      {
        name: values.name,
        email: values.email,
        password: await bcrypt.hash(values.password, 12),
        role: values.role,
        active: values.status === "active",
      },
      { transaction },
    );
    const employee = await Employee.create(
      { ...values, userId: user.id },
      { transaction, actorId: actor.id },
    );
    await recordEvent(
      "employee.created",
      {
        recipient: user.email,
        subject: "Chào mừng bạn đến với PeopleFlow",
        text: `Xin chào ${user.name}, hồ sơ nhân viên ${employee.code} của bạn đã được tạo. Hãy liên hệ HR để nhận hướng dẫn truy cập.`,
        userId: user.id,
      },
      transaction,
    );
    return employee.id;
  });
  await publish({ topic: "employee.created" });
  return get(id);
}
async function update(actor, id, input) {
  const values = employeeUpdateSchema.parse(input);
  checkRole(actor, values);
  let employeeUserId;
  await db.transaction(async (transaction) => {
    const employee = await Employee.findByPk(parseId(id), {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!employee) throw new HttpError(404, "Không tìm thấy nhân viên.");
    const user = await User.findByPk(employee.userId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (actor.role !== "admin" && user.role !== "employee")
      throw new HttpError(403, "HR không được sửa tài khoản quản trị.");
    if (
      user.id === actor.id &&
      (values.role !== "admin" || values.status !== "active")
    )
      throw new HttpError(
        422,
        "Không được tự hạ quyền hoặc vô hiệu hóa tài khoản Admin hiện tại.",
      );
    const securityChanged =
      Boolean(values.password) ||
      values.role !== user.role ||
      values.status !== employee.status;
    await user.update(
      {
        name: values.name,
        email: values.email,
        role: values.role,
        active: values.status === "active",
        ...(values.password
          ? { password: await bcrypt.hash(values.password, 12) }
          : {}),
        ...(securityChanged ? { tokenVersion: user.tokenVersion + 1 } : {}),
      },
      { transaction },
    );
    await employee.update(values, { transaction, actorId: actor.id });
    employeeUserId = user.id;
  });
  await publish({ topic: "employee.updated", employeeUserId });
  return get(id);
}
async function remove(actor, id) {
  let employeeUserId;
  await db.transaction(async (transaction) => {
    const employee = await Employee.findByPk(parseId(id), {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!employee) throw new HttpError(404, "Không tìm thấy nhân viên.");
    const user = await User.findByPk(employee.userId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (user.id === actor.id)
      throw new HttpError(422, "Không được vô hiệu hóa chính mình.");
    if (actor.role !== "admin" && user.role !== "employee")
      throw new HttpError(403, "HR không được vô hiệu hóa tài khoản quản trị.");
    await employee.update(
      { status: "inactive" },
      { transaction, actorId: actor.id },
    );
    await user.update(
      { active: false, tokenVersion: user.tokenVersion + 1 },
      { transaction },
    );
    employeeUserId = user.id;
  });
  await publish({ topic: "employee.deactivated", employeeUserId });
}

export class CreateEmployeeCommand {
  constructor(actor, input) {
    this.actor = actor;
    this.input = input;
    Object.freeze(this);
  }
}
export class UpdateEmployeeCommand {
  constructor(actor, id, input) {
    this.actor = actor;
    this.id = id;
    this.input = input;
    Object.freeze(this);
  }
}
export class DeleteEmployeeCommand {
  constructor(actor, id) {
    this.actor = actor;
    this.id = id;
    Object.freeze(this);
  }
}
export const commandHandlers = [
  [CreateEmployeeCommand, ({ actor, input }) => create(actor, input)],
  [UpdateEmployeeCommand, ({ actor, id, input }) => update(actor, id, input)],
  [DeleteEmployeeCommand, ({ actor, id }) => remove(actor, id)],
];
