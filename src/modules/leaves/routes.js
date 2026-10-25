// Mỗi thao tác có URL và khai báo riêng; không dùng resource route hoặc chung URL CRUD.
import { Router } from "express";
import * as c from "./controller.js";
import { allow } from "../../middleware/auth.js";
export const leaveRoutes = Router();
leaveRoutes.get("/api/leaves/list", c.list);
leaveRoutes.post("/api/leaves/create", c.create);
leaveRoutes.patch("/api/leaves/update/:id", allow("admin", "hr"), c.decide);
leaveRoutes.delete("/api/leaves/delete/:id", c.remove);
