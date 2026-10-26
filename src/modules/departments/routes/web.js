import { Router } from "express";
import * as controller from "../controllers/DepartmentWebController.js";
import { authorize } from "../../../core/authorization.js";
import { DepartmentPolicy } from "../policies/DepartmentPolicy.js";
export const webRoutes = Router();
webRoutes.get(
  "/departments/list",
  authorize(DepartmentPolicy, "create"),
  controller.index,
);
