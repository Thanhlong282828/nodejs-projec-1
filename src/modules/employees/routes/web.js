import { Router } from "express";
import * as controller from "../controllers/EmployeeWebController.js";
import { authorize } from "../../../core/authorization.js";
import { EmployeePolicy } from "../policies/EmployeePolicy.js";
export const webRoutes = Router();
webRoutes.get(
  "/employees/list",
  authorize(EmployeePolicy, "view"),
  controller.index,
);
