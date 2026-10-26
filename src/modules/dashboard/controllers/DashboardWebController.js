// Web controller tương tự Laravel: nhận Query rồi view(), không truy vấn model trực tiếp.
import { queryBus } from "../../../core/MessageBus.js";
import { GetDashboardQuery } from "../queries/DashboardQueries.js";
import { GetEmployeeListQuery } from "../../employees/queries/EmployeeQueries.js";
export async function index(req, res) {
  const stats = await queryBus.ask(new GetDashboardQuery(req.user));
  const recent =
    req.user.role === "employee"
      ? []
      : (await queryBus.ask(new GetEmployeeListQuery({ page: 1 }))).items.slice(
          0,
          5,
        );
  res.render("dashboard", {
    title: "Tổng quan",
    active: "dashboard",
    stats: stats.value,
    recent,
    cache: stats.cache,
  });
}
