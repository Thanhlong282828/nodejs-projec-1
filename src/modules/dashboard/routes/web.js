import { authorize } from "../../../core/authorization.js";
import { DashboardPolicy } from "../policies/DashboardPolicy.js";
import { Router } from "express";
import * as controller from "../controllers/DashboardWebController.js";
export const webRoutes = Router();
webRoutes.get("/", authorize(DashboardPolicy, "view"), controller.index);
