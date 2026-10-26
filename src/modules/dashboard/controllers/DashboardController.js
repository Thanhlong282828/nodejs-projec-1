import { queryBus } from "../../../core/MessageBus.js";
import { GetDashboardQuery } from "../queries/DashboardQueries.js";
import { data } from "../../../lib/http.js";
export const summary = async (req, res) => {
  const result = await queryBus.ask(new GetDashboardQuery(req.user));
  res.set("X-Cache", result.cache);
  data(res, result.value);
};
