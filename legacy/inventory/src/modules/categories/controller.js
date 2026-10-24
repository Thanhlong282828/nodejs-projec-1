// HƯỚNG DẪN HỌC: Controller: nhận req, gọi service/model và gửi JSON; không nhúng SQL vào đây.
// async trả Promise; await chờ kết quả I/O. Đọc theo luồng routes → controller → service → model → JSON.

// Nạp model của module: phần thực hiện truy vấn MySQL.
import * as model from "./model.js";
// Nạp các hàm kiểm tra đầu vào và lỗi HTTP dùng chung.
import { text } from "../../lib/http.js";
// Nạp hàm xuất JSON dùng chung để các endpoint có cùng cấu trúc.
import { json } from "../../views/json.js";
// Đọc search/filter/page, kiểm tra input rồi giao model truy vấn DB.
export const list = async (req, res) => json(res, await model.list());
export const create = async (req, res) =>
  json(res, await model.create(text(req.body?.name, "name", 100)), 201);
