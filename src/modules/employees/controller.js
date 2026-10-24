// Controller nhận req, gọi service rồi trả JSON. Lỗi async tự chuyển tới error middleware của Express 5.
import * as service from "./service.js";
import { data } from "../../lib/http.js";
export const list = async (req, res) =>
  data(res, await service.list(req.query));
export const get = async (req, res) =>
  data(res, await service.get(req.params.id));
export const create = async (req, res) =>
  data(res, await service.create(req.user, req.body), 201);
export const update = async (req, res) =>
  data(res, await service.update(req.user, req.params.id, req.body));
export const remove = async (req, res) => {
  await service.remove(req.user, req.params.id);
  res.status(204).end();
};
