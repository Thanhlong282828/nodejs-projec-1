// HƯỚNG DẪN HỌC: Xác thực: kiểm tra Bearer token và lấy user từ DB. Phân quyền: kiểm tra role admin sau xác thực.
// async trả Promise; await chờ kết quả I/O. Đọc theo luồng routes → controller → service → model → JSON.

// Nạp hàm xuất JSON dùng chung để các endpoint có cùng cấu trúc.
import jwt from "jsonwebtoken";
// Nạp cấu hình đã đọc từ môi trường, không hardcode secret trong module.
import { config } from "../config.js";
// Nạp model của module: phần thực hiện truy vấn MySQL.
import { byId } from "../modules/auth/model.js";
// Nạp các hàm kiểm tra đầu vào và lỗi HTTP dùng chung.
import { HttpError } from "../lib/http.js";
// Middleware async: phải xác thực xong mới gọi next() cho request đi tiếp.
export async function authenticate(req, res, next) {
  const match = /^Bearer (\S+)$/.exec(req.headers.authorization || "");
  if (!match) throw new HttpError(401, "Bearer token required");
  // Kiểm tra chữ ký, hạn token, issuer/audience và HS256; sai thì 401.
  let claims;
  try {
    claims = jwt.verify(match[1], config.secret, {
      algorithms: ["HS256"],
      issuer: "week7",
      audience: "week7-api",
    });
  } catch {
    throw new HttpError(401, "Invalid or expired token");
  }
  req.user = await byId(claims.sub);
  if (!req.user) throw new HttpError(401, "User no longer exists");
  next();
}
// Đã đăng nhập nhưng role khác admin thì 403; đủ quyền mới next().
export function admin(req, res, next) {
  if (req.user.role !== "admin") throw new HttpError(403, "Admin required");
  next();
}
