import { Router } from "express";
import * as controller from "../controllers/AuditController.js";
import { authorize } from "../../../core/authorization.js";
import { AuditPolicy } from "../policies/AuditPolicy.js";
export const apiRoutes = Router();
apiRoutes.get(
  "/api/audit/list",
  authorize(AuditPolicy, "view"),
  controller.list,
);
