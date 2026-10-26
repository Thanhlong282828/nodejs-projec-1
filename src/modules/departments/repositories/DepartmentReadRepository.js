// Read Repository chỉ truy vấn dữ liệu, không làm thay đổi trạng thái.
import { Department, Employee } from "../../../models/index.js";
export const list = (withEmployees = false) =>
  Department.findAll({
    order: [["name", "ASC"]],
    ...(withEmployees
      ? { include: { model: Employee, as: "employees", attributes: ["id"] } }
      : {}),
  });
