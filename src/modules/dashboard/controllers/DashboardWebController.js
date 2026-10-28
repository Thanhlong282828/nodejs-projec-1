// Web controller tương tự Laravel: nhận Query rồi view(), không truy vấn model trực tiếp.
import { can } from "../../access/permissions.js";
import { queryBus } from "../../../core/MessageBus.js";
import { GetDashboardQuery } from "../queries/DashboardQueries.js";
import { GetEmployeeListQuery } from "../../employees/queries/EmployeeQueries.js";
export async function index(req, res) {
  const stats = await queryBus.ask(new GetDashboardQuery(req.user));
  const recent = !can(req.user, "employees.view")
    ? []
    : (
        await queryBus.ask(new GetEmployeeListQuery(req.user, { page: 1 }))
      ).items.slice(0, 5);
  res.render("dashboard", {
    title: "Tổng quan",
    active: "dashboard",
    stats: stats.value,
    recent,
    cache: stats.cache,
  });
}
