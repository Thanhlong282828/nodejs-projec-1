// HƯỚNG DẪN HỌC: Controller: nhận req, gọi service/model và gửi JSON; không nhúng SQL vào đây.
// async trả Promise; await chờ kết quả I/O. Đọc theo luồng routes → controller → service → model → JSON.

// Nạp service: kiểm tra dữ liệu và thực hiện quy tắc nghiệp vụ.
import * as service from "./service.js";
// Nạp hàm xuất JSON dùng chung để các endpoint có cùng cấu trúc.
import { json } from "../../views/json.js";
export const list = async (req, res) =>
  json(res, await service.list(req.query));
export const get = async (req, res) =>
  json(res, await service.get(req.params.id));
export const create = async (req, res) =>
  json(res, await service.create(req.body || {}), 201);
export const update = async (req, res) =>
  json(res, await service.update(req.params.id, req.body || {}));
export const remove = async (req, res) => {
  await service.remove(req.params.id);
  res.status(204).end();
};
