// Read Repository chỉ truy vấn dữ liệu, không làm thay đổi trạng thái.
import { companyWhere } from "../../../core/tenant.js";
import { Department, Employee } from "../../../models/index.js";
export const list = (actor, withEmployees = false) =>
  Department.findAll({
    where: companyWhere(actor),
    order: [["name", "ASC"]],
    ...(withEmployees
      ? { include: { model: Employee, as: "employees", attributes: ["id"] } }
      : {}),
  });
