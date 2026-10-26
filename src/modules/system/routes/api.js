import { Router } from "express";
import * as controller from "../controllers/SystemController.js";
import { authorize } from "../../../core/authorization.js";
import { SystemPolicy } from "../policies/SystemPolicy.js";
export const apiRoutes = Router();
apiRoutes.get(
  "/api/system/status",
  authorize(SystemPolicy, "view"),
  controller.status,
);
