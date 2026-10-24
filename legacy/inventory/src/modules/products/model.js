// HƯỚNG DẪN HỌC: Model: truy cập MySQL, dùng placeholder ? cho dữ liệu đầu vào.
// async trả Promise; await chờ kết quả I/O. Đọc theo luồng routes → controller → service → model → JSON.

// Dùng pool MySQL chung thay vì tạo một connection cho mỗi hàm.
import { db } from "../../lib/db.js";
// Hàm model trả Promise; chạy SQL bằng tham số hóa, controller/service cần await kết quả.
export async function list({ search, category, page, limit, offset }) {
  const where = ["p.name LIKE ?"],
    params = [`%${search}%`];
  if (category) {
    where.push("p.category_id=?");
    params.push(category);
  }
  const clause = where.join(" AND ");
  // Đếm tổng dòng khớp điều kiện để trả metadata phân trang.
  const [[count]] = await db.execute(
    `SELECT COUNT(*) total FROM products p WHERE ${clause}`,
    params,
  );
  // mysql2 trả [rows,fields]; lấy rows. Dấu ? nhận tham số riêng để tránh SQL injection.
  const [rows] = await db.execute(
    `SELECT p.*,c.name category_name FROM products p JOIN categories c ON c.id=p.category_id WHERE ${clause} ORDER BY p.id DESC LIMIT ${limit} OFFSET ${offset}`,
    params,
  );
  return {
    items: rows,
    pagination: { page, per_page: limit, total: count.total },
  };
}
// Hàm model trả Promise; chạy SQL bằng tham số hóa, controller/service cần await kết quả.
export async function get(id) {
  // mysql2 trả [rows,fields]; lấy rows. Dấu ? nhận tham số riêng để tránh SQL injection.
  const [rows] = await db.execute("SELECT * FROM products WHERE id=?", [id]);
  return rows[0];
}
// Hàm model trả Promise; chạy SQL bằng tham số hóa, controller/service cần await kết quả.
export async function create(data) {
  // Lệnh ghi trả insertId/affectedRows; query task ràng buộc cả id và user_id.
  const [r] = await db.execute(
    "INSERT INTO products(name,price,stock,category_id) VALUES(?,?,?,?)",
    Object.values(data),
  );
  return get(r.insertId);
}
// Hàm model trả Promise; chạy SQL bằng tham số hóa, controller/service cần await kết quả.
export async function update(id, data) {
  // Lệnh ghi trả insertId/affectedRows; query task ràng buộc cả id và user_id.
  const [r] = await db.execute(
    "UPDATE products SET name=?,price=?,stock=?,category_id=? WHERE id=?",
    [...Object.values(data), id],
  );
  return r.affectedRows ? get(id) : null;
}
// Hàm model trả Promise; chạy SQL bằng tham số hóa, controller/service cần await kết quả.
export async function remove(id) {
  // Lệnh ghi trả insertId/affectedRows; query task ràng buộc cả id và user_id.
  const [r] = await db.execute("DELETE FROM products WHERE id=?", [id]);
  return r.affectedRows;
}
