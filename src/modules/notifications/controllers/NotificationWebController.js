// Web controller tương tự Laravel: nhận Query rồi view(), không truy vấn model trực tiếp.
import { queryBus } from "../../../core/MessageBus.js";
import { GetNotificationListQuery } from "../queries/NotificationQueries.js";
export async function index(req, res) {
  let messages = [],
    notice = "";
  try {
    messages = await queryBus.ask(new GetNotificationListQuery(req.user));
  } catch {
    notice = "Dịch vụ thông báo đang khởi động. Hãy thử lại sau.";
  }
  res.render("notifications", {
    title: "Thông báo",
    active: "notifications",
    messages,
    notice,
  });
}
