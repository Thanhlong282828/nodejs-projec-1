import { Router } from "express";
import * as controller from "../controllers/AttendanceWebController.js";
import { authorize } from "../../../core/authorization.js";
import { AttendancePolicy } from "../policies/AttendancePolicy.js";
export const webRoutes = Router();
webRoutes.get(
  "/attendance/list",
  authorize(AttendancePolicy, "view"),
  controller.index,
);
