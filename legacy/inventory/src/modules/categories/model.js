// HƯỚNG DẪN HỌC: Model: truy cập MySQL, dùng placeholder ? cho dữ liệu đầu vào.
// async trả Promise; await chờ kết quả I/O. Đọc theo luồng routes → controller → service → model → JSON.

// Dùng pool MySQL chung thay vì tạo một connection cho mỗi hàm.
import { db } from "../../lib/db.js";
// Hàm model trả Promise; chạy SQL bằng tham số hóa, controller/service cần await kết quả.
export async function list() {
  // mysql2 trả [rows,fields]; lấy rows. Dấu ? nhận tham số riêng để tránh SQL injection.
  const [rows] = await db.execute("SELECT * FROM categories ORDER BY id");
  return rows;
}
// Hàm model trả Promise; chạy SQL bằng tham số hóa, controller/service cần await kết quả.
export async function create(name) {
  // Lệnh ghi trả insertId/affectedRows; query task ràng buộc cả id và user_id.
  const [r] = await db.execute("INSERT INTO categories(name) VALUES(?)", [
    name,
  ]);
  return { id: r.insertId, name };
}
