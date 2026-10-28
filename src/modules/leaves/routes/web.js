import { Router } from "express";
import * as controller from "../controllers/LeaveWebController.js";
import { authorize } from "../../../core/authorization.js";
import { LeavePolicy } from "../policies/LeavePolicy.js";
export const webRoutes = Router();
webRoutes.get("/leaves/list", authorize(LeavePolicy, "view"), controller.index);
