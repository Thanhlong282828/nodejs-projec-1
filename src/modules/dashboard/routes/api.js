import { authorize } from "../../../core/authorization.js";
import { DashboardPolicy } from "../policies/DashboardPolicy.js";
import { Router } from "express";
import * as controller from "../controllers/DashboardController.js";
export const apiRoutes = Router();
apiRoutes.get(
  "/api/dashboard/summary",
  authorize(DashboardPolicy, "view"),
  controller.summary,
);
