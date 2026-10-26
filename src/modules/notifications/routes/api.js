import { Router } from "express";
import * as controller from "../controllers/NotificationController.js";
export const apiRoutes = Router();
apiRoutes.get("/api/notifications/list", controller.list);
