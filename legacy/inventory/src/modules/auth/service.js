// HƯỚNG DẪN HỌC: Service: quy tắc nghiệp vụ và validation; dùng model để đọc/ghi DB.
// async trả Promise; await chờ kết quả I/O. Đọc theo luồng routes → controller → service → model → JSON.

// Nạp bcrypt để hash mật khẩu và so sánh khi đăng nhập.
import bcrypt from "bcryptjs";
// Nạp thư viện ký và kiểm tra JWT; không tự viết thuật toán mã hóa.
import jwt from "jsonwebtoken";
// Nạp model của module: phần thực hiện truy vấn MySQL.
import * as model from "./model.js";
// Nạp cấu hình đã đọc từ môi trường, không hardcode secret trong module.
import { config } from "../../config.js";
// Nạp các hàm kiểm tra đầu vào và lỗi HTTP dùng chung.
import { HttpError, text } from "../../lib/http.js";
// Đăng ký: chuẩn hóa input, kiểm tra email/password, hash rồi mới lưu.
export async function register(body) {
  // Tên bắt buộc; email chuyển về chữ thường để tránh tài khoản khác nhau vì chữ hoa.
  const name = text(body.name, "name", 100),
    email = text(body.email, "email", 191).toLowerCase();
  // Kiểm tra định dạng email trước khi ghi database.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new HttpError(422, "Invalid email");
  // Bcrypt chỉ dùng tối đa 72 byte; yêu cầu ít nhất 10 ký tự cho bài demo.
  if (
    typeof body.password !== "string" ||
    body.password.length < 10 ||
    Buffer.byteLength(body.password) > 72
  )
    throw new HttpError(422, "Password: min 10 characters, max 72 bytes");
  // Chờ hash bcrypt (cost 12) hoàn tất; chỉ lưu hash, không lưu mật khẩu gốc.
  return model.create(name, email, await bcrypt.hash(body.password, 12));
}
// Đăng nhập: tìm user bằng email, so sánh hash và trả token khi khớp.
export async function login(body) {
  const email = text(body.email, "email", 191).toLowerCase();
  if (typeof body.password !== "string")
    throw new HttpError(422, "Password required");
  // await đợi model trả user; không có await thì nhận Promise thay vì bản ghi.
  const user = await model.byEmail(email);
  // So sánh password nhập với hash; dùng cùng thông báo khi email/password sai.
  if (!user || !(await bcrypt.compare(body.password, user.password)))
    throw new HttpError(401, "Invalid credentials");
  // Ký JWT chứa subject=user ID, sống 1 giờ; token không chứa password và payload không mã hóa.
  return {
    token: jwt.sign({}, config.secret, {
      subject: String(user.id),
      expiresIn: "1h",
      issuer: "week7",
      audience: "week7-api",
    }),
    token_type: "Bearer",
    expires_in: 3600,
  };
}
