// Routing chỉ ghép method + URL với middleware/quyền và controller.
import { Router } from "express";
import { allow } from "../../middleware/auth.js";
import * as c from "./controller.js";
export const employeeRoutes = Router();
employeeRoutes.use(allow("admin", "hr"));
employeeRoutes.get("/", c.list);
employeeRoutes.get("/:id", c.get);
employeeRoutes.post("/", c.create);
employeeRoutes.put("/:id", c.update);
employeeRoutes.delete("/:id", c.remove);
