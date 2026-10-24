// HƯỚNG DẪN HỌC: Service: quy tắc nghiệp vụ và validation; dùng model để đọc/ghi DB.
// async trả Promise; await chờ kết quả I/O. Đọc theo luồng routes → controller → service → model → JSON.

// Nạp model của module: phần thực hiện truy vấn MySQL.
import * as model from "./model.js";
// Nạp các hàm kiểm tra đầu vào và lỗi HTTP dùng chung.
import { HttpError, text, integer, page, search } from "../../lib/http.js";
// Kiểm tra và chọn field cho phép; không đưa trực tiếp toàn bộ req.body vào SQL.
export function validate(body) {
  const name = text(body.name, "name");
  if (
    typeof body.price !== "number" ||
    !Number.isFinite(body.price) ||
    body.price <= 0 ||
    // Giá phải là số hữu hạn >0, tối đa 2 chữ số thập phân và vừa DECIMAL(12,2).
    body.price > 9999999999.99 ||
    Math.abs(body.price * 100 - Math.round(body.price * 100)) > 0.0001
  )
    // Giá phải là số hữu hạn >0, tối đa 2 chữ số thập phân và vừa DECIMAL(12,2).
    throw new HttpError(422, "price > 0 with max 2 decimal places");
  if (
    !Number.isInteger(body.stock) ||
    body.stock < 0 ||
    body.stock > 4294967295
  )
    // Tồn kho phải là số nguyên không âm, nằm trong phạm vi INT UNSIGNED.
    throw new HttpError(422, "stock must be unsigned integer");
  if (!Number.isInteger(body.category_id) || body.category_id <= 0)
    // Kiểm tra category_id là số nguyên dương; FK trong DB kiểm tra category có thật.
    throw new HttpError(422, "category_id must be positive integer");
  return {
    name,
    price: body.price,
    stock: body.stock,
    category_id: body.category_id,
  };
}
export const list = (query) =>
  // Đọc search/filter/page, kiểm tra input rồi giao model truy vấn DB.
  model.list({
    ...page(query),
    search: search(query.search),
    category:
      query.category_id === undefined
        ? null
        : integer(query.category_id, "category_id"),
  });
// Kiểm tra ID; không tìm thấy (hoặc task không thuộc user) trả 404.
export async function get(id) {
  const row = await model.get(integer(id));
  if (!row) throw new HttpError(404, "Product missing");
  return row;
}
export const create = (body) => model.create(validate(body));
// Kiểm tra ID/body rồi cập nhật; không có bản ghi hợp lệ trả 404.
export async function update(id, body) {
  const row = await model.update(integer(id), validate(body));
  if (!row) throw new HttpError(404, "Product missing");
  return row;
}
// Xóa theo ID hợp lệ; task phải thuộc user; không xóa được trả 404.
export async function remove(id) {
  if (!(await model.remove(integer(id))))
    throw new HttpError(404, "Product missing");
}
