import { Router } from "express";
import * as controller from "../controllers/AuditWebController.js";
import { authorize } from "../../../core/authorization.js";
import { AuditPolicy } from "../policies/AuditPolicy.js";
export const webRoutes = Router();
webRoutes.get("/audit/list", authorize(AuditPolicy, "view"), controller.index);
