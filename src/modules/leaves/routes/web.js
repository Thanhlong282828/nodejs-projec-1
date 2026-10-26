import { Router } from "express";
import * as controller from "../controllers/LeaveWebController.js";
export const webRoutes = Router();
webRoutes.get("/leaves/list", controller.index);
