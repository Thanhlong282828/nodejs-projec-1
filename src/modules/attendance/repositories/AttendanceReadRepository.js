// Read Repository chỉ truy vấn dữ liệu, không làm thay đổi trạng thái.
import { Attendance, Employee, User } from "../../../models/index.js";
import { paginationSchema } from "../../../lib/validation.js";
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
