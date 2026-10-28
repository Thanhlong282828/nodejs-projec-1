// Web controller tương tự Laravel: nhận Query rồi view(), không truy vấn model trực tiếp.
import { queryBus } from "../../../core/MessageBus.js";
import { GetDepartmentListQuery } from "../queries/DepartmentQueries.js";
export const index = async (req, res) =>
  res.render("departments", {
    title: "Phòng ban",
    active: "departments",
    departments: await queryBus.ask(new GetDepartmentListQuery(req.user, true)),
  });
