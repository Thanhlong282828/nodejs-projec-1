// Mỗi thao tác có URL và khai báo riêng; không dùng resource route hoặc chung URL CRUD.
import { Router } from "express";
import * as c from "./controller.js";
import { allow } from "../../middleware/auth.js";
export const departmentRoutes = Router();
departmentRoutes.get("/api/departments/list", c.list);
departmentRoutes.post(
  "/api/departments/create",
  allow("admin", "hr"),
  c.create,
);
departmentRoutes.put(
  "/api/departments/update/:id",
  allow("admin", "hr"),
  c.update,
);
departmentRoutes.delete(
  "/api/departments/delete/:id",
  allow("admin", "hr"),
  c.remove,
);
