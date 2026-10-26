import { Router } from "express";
import * as controller from "../controllers/DashboardController.js";
export const apiRoutes = Router();
apiRoutes.get("/api/dashboard/summary", controller.summary);
