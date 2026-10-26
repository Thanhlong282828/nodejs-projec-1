// Web controller tương tự Laravel: nhận Query rồi view(), không truy vấn model trực tiếp.
import { queryBus } from "../../../core/MessageBus.js";
import { GetEmployeeListQuery } from "../queries/EmployeeQueries.js";
import { GetDepartmentListQuery } from "../../departments/queries/DepartmentQueries.js";
export const index = async (req, res) =>
  res.render("employees", {
    title: "Nhân viên",
    active: "employees",
    result: await queryBus.ask(new GetEmployeeListQuery(req.query)),
    departments: await queryBus.ask(new GetDepartmentListQuery()),
    query: req.query,
  });
