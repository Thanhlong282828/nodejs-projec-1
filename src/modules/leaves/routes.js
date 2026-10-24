// Routing chỉ ghép method + URL với middleware/quyền và controller.
import { Router } from "express";
import * as c from "./controller.js";
import { allow } from "../../middleware/auth.js";
export const leaveRoutes = Router();
leaveRoutes.get("/", c.list);
leaveRoutes.post("/", c.create);
leaveRoutes.patch("/:id/decision", allow("admin", "hr"), c.decide);
leaveRoutes.delete("/:id", c.remove);
