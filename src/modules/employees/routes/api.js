// Mỗi thao tác có URL và khai báo riêng; không dùng resource route hoặc chung URL CRUD.
import { Router } from "express";
import * as c from "../controllers/EmployeeController.js";
import { authorize } from "../../../core/authorization.js";
import { EmployeePolicy } from "../policies/EmployeePolicy.js";
export const employeeRoutes = Router();
employeeRoutes.get(
  "/api/employees/list",
  authorize(EmployeePolicy, "view"),
  c.list,
);
employeeRoutes.get(
  "/api/employees/detail/:id",
  authorize(EmployeePolicy, "view"),
  c.get,
);
employeeRoutes.post(
  "/api/employees/create",
  authorize(EmployeePolicy, "create"),
  c.create,
);
employeeRoutes.put(
  "/api/employees/update/:id",
  authorize(EmployeePolicy, "update"),
  c.update,
);
employeeRoutes.delete(
  "/api/employees/delete/:id",
  authorize(EmployeePolicy, "delete"),
  c.remove,
);
