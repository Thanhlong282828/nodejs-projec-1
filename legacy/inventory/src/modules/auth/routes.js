// HƯỚNG DẪN HỌC: Routes: ghép URL + HTTP method với middleware và controller.
// async trả Promise; await chờ kết quả I/O. Đọc theo luồng routes → controller → service → model → JSON.

import { Router } from "express";
// Nạp bộ giới hạn số lần gọi để giảm việc thử đăng nhập liên tục.
import { rateLimit } from "express-rate-limit";
// Nạp controller: nhận request, gọi xử lý và gửi response.
import * as controller from "./controller.js";
// Nạp middleware kiểm tra đăng nhập/quyền trước khi gọi controller.
import { authenticate } from "../../middleware/auth.js";
// Tạo nhóm route; authenticate kiểm tra token, admin kiểm tra quyền, controller xử lý cuối.
export const authRoutes = Router();
const limit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});
// Khai báo method/path và thứ tự middleware; write sản phẩm phải đăng nhập và là admin.
authRoutes.post("/register", limit, controller.register);
// Khai báo method/path và thứ tự middleware; write sản phẩm phải đăng nhập và là admin.
authRoutes.post("/login", limit, controller.login);
// Khai báo method/path và thứ tự middleware; write sản phẩm phải đăng nhập và là admin.
authRoutes.get("/profile", authenticate, controller.profile);
