// Mỗi thao tác có URL và khai báo riêng; không dùng resource route hoặc chung URL CRUD.
import { Router } from "express";
import * as c from "./controller.js";
export const attendanceRoutes = Router();
attendanceRoutes.get("/api/attendance/list", c.list);
attendanceRoutes.post("/api/attendance/check-in", c.checkIn);
attendanceRoutes.post("/api/attendance/check-out", c.checkOut);
