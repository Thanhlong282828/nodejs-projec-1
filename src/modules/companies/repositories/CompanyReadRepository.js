import { Company } from "../../../models/index.js";
import { companyWhere } from "../../../core/tenant.js";
import { parseId } from "../../../lib/validation.js";
import { HttpError } from "../../../lib/http.js";
export const list = (actor) =>
  Company.findAll({ where: { id: companyWhere(actor).companyId } });
export async function get(actor, id) {
  if (parseId(id) !== companyWhere(actor).companyId)
    throw new HttpError(404, "Không tìm thấy công ty.");
  const row = await Company.findOne({
    where: { id: companyWhere(actor).companyId },
  });
  if (!row || row.id !== companyWhere(actor).companyId)
    throw new HttpError(404, "Không tìm thấy công ty.");
  return row;
}
