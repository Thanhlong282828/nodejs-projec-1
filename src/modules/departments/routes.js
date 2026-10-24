// Routing chỉ ghép method + URL với middleware/quyền và controller.
import { Router } from "express";
import * as c from "./controller.js";
import { allow } from "../../middleware/auth.js";
export const departmentRoutes = Router();
departmentRoutes.get("/", c.list);
departmentRoutes.post("/", allow("admin", "hr"), c.create);
departmentRoutes.put("/:id", allow("admin", "hr"), c.update);
departmentRoutes.delete("/:id", allow("admin", "hr"), c.remove);
