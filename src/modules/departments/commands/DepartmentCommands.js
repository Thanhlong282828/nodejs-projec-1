import { companyWhere } from "../../../core/tenant.js";
// Command Handler: nghiệp vụ ghi + transaction + observer/outbox, tương tự DJI.
import { db } from "../../../lib/db.js";
import { Department, Employee } from "../../../models/index.js";
import { departmentSchema } from "../requests/DepartmentRequest.js";
import { parseId } from "../../../lib/validation.js";
import { HttpError } from "../../../lib/http.js";
import { publish } from "../../../events/index.js";
async function create(actor, input) {
  const result = await db.transaction((transaction) =>
    Department.create(
      { ...departmentSchema.parse(input), ...companyWhere(actor) },
      {
        transaction,
        actorId: actor.id,
      },
    ),
  );
  await publish({ companyId: actor.companyId, topic: "department.created" });
  return result;
}
async function update(actor, id, input) {
  const values = departmentSchema.parse(input);
  const result = await db.transaction(async (transaction) => {
    const row = await Department.findOne({
      where: { id: parseId(id), ...companyWhere(actor) },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!row) throw new HttpError(404, "Không tìm thấy phòng ban.");
    return row.update(values, { transaction, actorId: actor.id });
  });
  await publish({ companyId: actor.companyId, topic: "department.updated" });
  return result;
}
async function remove(actor, id) {
  await db.transaction(async (transaction) => {
    const row = await Department.findOne({
      where: { id: parseId(id), ...companyWhere(actor) },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!row) throw new HttpError(404, "Không tìm thấy phòng ban.");
    if (await Employee.count({ where: { departmentId: row.id }, transaction }))
      throw new HttpError(
        409,
        "Phòng ban còn nhân viên. Hãy chuyển nhân viên trước.",
      );
    await row.destroy({ transaction, actorId: actor.id });
  });
  await publish({ companyId: actor.companyId, topic: "department.deleted" });
}

export class CreateDepartmentCommand {
  constructor(actor, input) {
    this.actor = actor;
    this.input = input;
    Object.freeze(this);
  }
}
export class UpdateDepartmentCommand {
  constructor(actor, id, input) {
    this.actor = actor;
    this.id = id;
    this.input = input;
    Object.freeze(this);
  }
}
export class DeleteDepartmentCommand {
  constructor(actor, id) {
    this.actor = actor;
    this.id = id;
    Object.freeze(this);
  }
}
export const commandHandlers = [
  [CreateDepartmentCommand, ({ actor, input }) => create(actor, input)],
  [UpdateDepartmentCommand, ({ actor, id, input }) => update(actor, id, input)],
  [DeleteDepartmentCommand, ({ actor, id }) => remove(actor, id)],
];
