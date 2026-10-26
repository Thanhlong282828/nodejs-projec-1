// Mỗi thao tác có URL và khai báo riêng; không dùng resource route hoặc chung URL CRUD.
import { Router } from "express";
import { authorize } from "../../../core/authorization.js";
import { AttendancePolicy } from "../policies/AttendancePolicy.js";
import * as c from "../controllers/AttendanceController.js";
export const attendanceRoutes = Router();
attendanceRoutes.get(
  "/api/attendance/list",
  authorize(AttendancePolicy, "view"),
  c.list,
);
attendanceRoutes.post(
  "/api/attendance/check-in",
  authorize(AttendancePolicy, "checkIn"),
  c.checkIn,
);
attendanceRoutes.post(
  "/api/attendance/check-out",
  authorize(AttendancePolicy, "checkOut"),
  c.checkOut,
);
