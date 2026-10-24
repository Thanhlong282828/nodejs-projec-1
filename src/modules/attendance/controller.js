// Controller nhận req, gọi service rồi trả JSON. Lỗi async tự chuyển tới error middleware của Express 5.
import * as service from "./service.js";
import { data } from "../../lib/http.js";
export const list = async (req, res) =>
  data(res, await service.list(req.user, req.query));
export const checkIn = async (req, res) =>
  data(res, await service.checkIn(req.user), 201);
export const checkOut = async (req, res) =>
  data(res, await service.checkOut(req.user));
