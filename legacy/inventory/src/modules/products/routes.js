// HƯỚNG DẪN HỌC: Routes: ghép URL + HTTP method với middleware và controller.
// async trả Promise; await chờ kết quả I/O. Đọc theo luồng routes → controller → service → model → JSON.

import { Router } from "express";
// Nạp controller: nhận request, gọi xử lý và gửi response.
import * as c from "./controller.js";
// Nạp middleware kiểm tra đăng nhập/quyền trước khi gọi controller.
import { authenticate, admin } from "../../middleware/auth.js";
// Tạo nhóm route; authenticate kiểm tra token, admin kiểm tra quyền, controller xử lý cuối.
export const productRoutes = Router();
// Khai báo method/path và thứ tự middleware; write sản phẩm phải đăng nhập và là admin.
productRoutes.get("/", c.list);
// Khai báo method/path và thứ tự middleware; write sản phẩm phải đăng nhập và là admin.
productRoutes.get("/:id", c.get);
// Khai báo method/path và thứ tự middleware; write sản phẩm phải đăng nhập và là admin.
productRoutes.post("/", authenticate, admin, c.create);
productRoutes.put("/:id", authenticate, admin, c.update);
productRoutes.delete("/:id", authenticate, admin, c.remove);
