// Web controller tương tự Laravel: nhận Query rồi view(), không truy vấn model trực tiếp.
import { queryBus } from "../../../core/MessageBus.js";
import { GetLeaveListQuery } from "../queries/LeaveQueries.js";
export const index = async (req, res) =>
  res.render("leaves", {
    title: "Nghỉ phép",
    active: "leaves",
    result: await queryBus.ask(new GetLeaveListQuery(req.user, req.query)),
    query: req.query,
  });
