import { queryBus } from "../../../core/MessageBus.js";
import { GetNotificationListQuery } from "../queries/NotificationQueries.js";
import { data } from "../../../lib/http.js";
export const list = async (req, res) => {
  const result = await queryBus.ask(new GetNotificationListQuery(req.user));
  data(res, result);
};
