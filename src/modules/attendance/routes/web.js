import { Router } from "express";
import * as controller from "../controllers/AttendanceWebController.js";
export const webRoutes = Router();
webRoutes.get("/attendance/list", controller.index);
