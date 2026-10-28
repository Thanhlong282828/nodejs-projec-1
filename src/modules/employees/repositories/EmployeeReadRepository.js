// Read Repository chỉ truy vấn dữ liệu, không làm thay đổi trạng thái.
import { companyWhere } from "../../../core/tenant.js";
import { Op } from "sequelize";
import { Employee, User, Department } from "../../../models/index.js";
import { paginationSchema, parseId } from "../../../lib/validation.js";
import { HttpError } from "../../../lib/http.js";
const include = [
  {
    model: User,
    as: "user",
    attributes: ["id", "name", "email", "role", "active"],
  },
  { model: Department, as: "department" },
];
export async function list(actor, query) {
  const q = paginationSchema.parse(query);
  const where = companyWhere(actor);
  if (q.departmentId) where.departmentId = q.departmentId;
  if (q.search)
    where[Op.or] = [
      { code: { [Op.like]: `%${q.search}%` } },
      { "$user.name$": { [Op.like]: `%${q.search}%` } },
      { "$user.email$": { [Op.like]: `%${q.search}%` } },
    ];
  const result = await Employee.findAndCountAll({
    where,
    include,
    order: [["id", "DESC"]],
    limit: 10,
    offset: (q.page - 1) * 10,
    subQuery: false,
  });
  return {
    items: result.rows,
    pagination: { page: q.page, perPage: 10, total: result.count },
  };
}
export async function get(actor, id) {
  const employee = await Employee.findOne({
    where: { id: parseId(id), ...companyWhere(actor) },
    include,
  });
  if (!employee) throw new HttpError(404, "Không tìm thấy nhân viên.");
  return employee;
}
