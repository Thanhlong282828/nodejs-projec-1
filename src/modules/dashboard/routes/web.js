import { Router } from "express";
import * as controller from "../controllers/DashboardWebController.js";
export const webRoutes = Router();
webRoutes.get("/", controller.index);
