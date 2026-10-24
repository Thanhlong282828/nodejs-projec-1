// Routing chỉ ghép method + URL với middleware/quyền và controller.
import { Router } from "express";
import * as c from "./controller.js";
export const attendanceRoutes = Router();
attendanceRoutes.get("/", c.list);
attendanceRoutes.post("/check-in", c.checkIn);
attendanceRoutes.post("/check-out", c.checkOut);
