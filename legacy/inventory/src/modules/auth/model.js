// HƯỚNG DẪN HỌC: Model: truy cập MySQL, dùng placeholder ? cho dữ liệu đầu vào.
// async trả Promise; await chờ kết quả I/O. Đọc theo luồng routes → controller → service → model → JSON.

// Dùng pool MySQL chung thay vì tạo một connection cho mỗi hàm.
import { db } from "../../lib/db.js";
// Placeholder ? truyền email riêng với SQL; chỉ auth service dùng bản ghi có password hash.
export async function byEmail(email) {
  // mysql2 trả [rows,fields]; lấy rows. Dấu ? nhận tham số riêng để tránh SQL injection.
  const [rows] = await db.execute("SELECT * FROM users WHERE email=?", [email]);
  return rows[0];
}
// Chọn rõ các cột an toàn, không SELECT password khi trả profile.
export async function byId(id) {
  // mysql2 trả [rows,fields]; lấy rows. Dấu ? nhận tham số riêng để tránh SQL injection.
  const [rows] = await db.execute(
    "SELECT id,name,email,role FROM users WHERE id=?",
    [id],
  );
  return rows[0];
}
// Hàm model trả Promise; chạy SQL bằng tham số hóa, controller/service cần await kết quả.
export async function create(name, email, password) {
  // Lệnh ghi trả insertId/affectedRows; query task ràng buộc cả id và user_id.
  const [result] = await db.execute(
    // Tạo user với role mặc định user từ schema; trả bản ghi công khai theo insertId.
    "INSERT INTO users(name,email,password) VALUES(?,?,?)",
    [name, email, password],
  );
  return byId(result.insertId);
}
