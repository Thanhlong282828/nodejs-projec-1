// Mỗi thao tác có URL và khai báo riêng; không dùng resource route hoặc chung URL CRUD.
import { Router } from "express";
import * as c from "../controllers/DepartmentController.js";
import { authorize } from "../../../core/authorization.js";
import { DepartmentPolicy } from "../policies/DepartmentPolicy.js";
export const departmentRoutes = Router();
departmentRoutes.get(
  "/api/departments/list",
  authorize(DepartmentPolicy, "view"),
  c.list,
);
departmentRoutes.post(
  "/api/departments/create",
  authorize(DepartmentPolicy, "create"),
  c.create,
);
departmentRoutes.put(
  "/api/departments/update/:id",
  authorize(DepartmentPolicy, "update"),
  c.update,
);
departmentRoutes.delete(
  "/api/departments/delete/:id",
  authorize(DepartmentPolicy, "delete"),
  c.remove,
);
