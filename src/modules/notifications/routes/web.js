import { Router } from "express";
import * as controller from "../controllers/NotificationWebController.js";
export const webRoutes = Router();
webRoutes.get("/notifications/list", controller.index);
