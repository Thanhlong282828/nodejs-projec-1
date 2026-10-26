import { queryBus } from "../../../core/MessageBus.js";
import { GetAuditListQuery } from "../queries/AuditQueries.js";
import { data } from "../../../lib/http.js";
export const list = async (req, res) => {
  const result = await queryBus.ask(new GetAuditListQuery(req.query));
  data(res, result);
};
