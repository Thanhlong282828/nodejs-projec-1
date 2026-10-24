// Controller nhận req, gọi service rồi trả JSON. Lỗi async tự chuyển tới error middleware của Express 5.
import * as service from "./service.js";
import { config } from "../../config.js";
import { data } from "../../lib/http.js";
export async function login(req, res) {
  const result = await service.login(req.body);
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
  await req.user.increment("tokenVersion");
  res.clearCookie("hrm_token", { path: "/" });
  data(res, { loggedOut: true });
}
