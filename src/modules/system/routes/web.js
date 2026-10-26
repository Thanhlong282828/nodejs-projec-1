import { Router } from "express";
import * as controller from "../controllers/SystemWebController.js";
import { authorize } from "../../../core/authorization.js";
import { SystemPolicy } from "../policies/SystemPolicy.js";
export const webRoutes = Router();
webRoutes.get(
  "/system/status",
  authorize(SystemPolicy, "view"),
  controller.index,
);
