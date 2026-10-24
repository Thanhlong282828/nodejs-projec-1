// Service kiểm tra nghiệp vụ, gọi model Sequelize và giữ các thay đổi liên quan trong transaction.
import { db } from "../../lib/db.js";
import { Department, Employee } from "../../models/index.js";
import { departmentSchema, parseId } from "../../lib/validation.js";
import { HttpError } from "../../lib/http.js";
import { publish } from "../../events/index.js";
export const list = () => Department.findAll({ order: [["name", "ASC"]] });
export async function create(actor, input) {
  const result = await db.transaction((transaction) =>
    Department.create(departmentSchema.parse(input), {
      transaction,
      actorId: actor.id,
    }),
  );
  await publish({ topic: "department.created" });
  return result;
}
export async function update(actor, id, input) {
  const values = departmentSchema.parse(input);
  const result = await db.transaction(async (transaction) => {
    const row = await Department.findByPk(parseId(id), {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!row) throw new HttpError(404, "Không tìm thấy phòng ban.");
    return row.update(values, { transaction, actorId: actor.id });
  });
  await publish({ topic: "department.updated" });
  return result;
}
export async function remove(actor, id) {
  await db.transaction(async (transaction) => {
    const row = await Department.findByPk(parseId(id), {
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
  await publish({ topic: "department.deleted" });
}
