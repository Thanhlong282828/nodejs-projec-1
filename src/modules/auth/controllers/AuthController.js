// Controller nhận req, gọi service rồi trả JSON. Lỗi async tự chuyển tới error middleware của Express 5.
import { queryBus, commandBus } from "../../../core/MessageBus.js";
import { LoginCommand, LogoutCommand } from "../commands/AuthCommands.js";
import { GetProfileQuery } from "../queries/AuthQueries.js";
import { config } from "../../../config.js";
import { data } from "../../../lib/http.js";
export async function login(req, res) {
  const result = await commandBus.dispatch(new LoginCommand(req.body));
  res.cookie("hrm_token", result.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.secure,
    maxAge: 8 * 3600000,
    path: "/",
  });
  data(res, result);
}
export async function logout(req, res) {
  const result = await commandBus.dispatch(new LogoutCommand(req.user));
  res.clearCookie("hrm_token", { path: "/" });
  data(res, result);
}

export const profile = async (req, res) =>
  data(res, await queryBus.ask(new GetProfileQuery(req.user)));
export const loginPage = (req, res) =>
  res.render("login", { title: "Đăng nhập" });
