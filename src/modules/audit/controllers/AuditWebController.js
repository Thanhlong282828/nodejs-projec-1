// Web controller tương tự Laravel: nhận Query rồi view(), không truy vấn model trực tiếp.
import { queryBus } from "../../../core/MessageBus.js";
import { GetRecentAuditQuery } from "../queries/AuditQueries.js";
export const index = async (req, res) =>
  res.render("audit", {
    title: "Nhật ký thay đổi",
    active: "audit",
    rows: await queryBus.ask(new GetRecentAuditQuery(req.user)),
  });
