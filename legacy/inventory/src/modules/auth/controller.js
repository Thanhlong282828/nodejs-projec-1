// HƯỚNG DẪN HỌC: Controller: nhận req, gọi service/model và gửi JSON; không nhúng SQL vào đây.
// async trả Promise; await chờ kết quả I/O. Đọc theo luồng routes → controller → service → model → JSON.

// Nạp service: kiểm tra dữ liệu và thực hiện quy tắc nghiệp vụ.
import * as service from "./service.js";
// Nạp hàm xuất JSON dùng chung để các endpoint có cùng cấu trúc.
import { json } from "../../views/json.js";
export const register = async (req, res) =>
  json(res, await service.register(req.body || {}), 201);
export const login = async (req, res) =>
  json(res, await service.login(req.body || {}));
export const profile = (req, res) => json(res, req.user);
