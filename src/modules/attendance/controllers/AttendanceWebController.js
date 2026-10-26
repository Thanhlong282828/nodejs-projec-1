// Web controller tương tự Laravel: nhận Query rồi view(), không truy vấn model trực tiếp.
import { queryBus } from "../../../core/MessageBus.js";
export const index = (req, res) =>
  res.render("attendance", { title: "Chấm công", active: "attendance" });
