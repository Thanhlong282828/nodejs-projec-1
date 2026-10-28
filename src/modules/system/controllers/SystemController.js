import { queryBus } from "../../../core/MessageBus.js";
import { GetSystemStatusQuery } from "../queries/SystemQueries.js";
import { data } from "../../../lib/http.js";
export const status = async (req, res) => {
  const result = await queryBus.ask(new GetSystemStatusQuery(req.user));
  data(res, result);
};
import { GetHealthQuery } from "../queries/SystemQueries.js";
export const health = async (req, res) =>
  res.json(await queryBus.ask(new GetHealthQuery()));
