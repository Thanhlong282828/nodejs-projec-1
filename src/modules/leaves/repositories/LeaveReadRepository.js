import { companyWhere } from "../../../core/tenant.js";
import { can } from "../../access/permissions.js";
// Read Repository chỉ truy vấn dữ liệu, không làm thay đổi trạng thái.
import { Employee, User, Leave, Department } from "../../../models/index.js";
import { paginationSchema } from "../../../lib/validation.js";
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
    where = companyWhere(user);
  if (!can(user, "leaves.viewAll")) where.employeeId = user.employee?.id || 0;
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
