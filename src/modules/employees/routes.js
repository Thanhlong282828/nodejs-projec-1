// Mỗi thao tác có URL và khai báo riêng; không dùng resource route hoặc chung URL CRUD.
import { Router } from "express";
import * as c from "./controller.js";
import { allow } from "../../middleware/auth.js";
export const employeeRoutes = Router();
employeeRoutes.get("/api/employees/list", allow("admin", "hr"), c.list);
employeeRoutes.get("/api/employees/detail/:id", allow("admin", "hr"), c.get);
employeeRoutes.post("/api/employees/create", allow("admin", "hr"), c.create);
employeeRoutes.put("/api/employees/update/:id", allow("admin", "hr"), c.update);
employeeRoutes.delete(
  "/api/employees/delete/:id",
  allow("admin", "hr"),
  c.remove,
);
