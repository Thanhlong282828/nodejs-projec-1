// Mỗi thao tác có URL và khai báo riêng; không dùng resource route hoặc chung URL CRUD.
import { Router } from "express";
import * as c from "../controllers/LeaveController.js";
import { authorize } from "../../../core/authorization.js";
import { LeavePolicy } from "../policies/LeavePolicy.js";
export const leaveRoutes = Router();
leaveRoutes.get("/api/leaves/list", authorize(LeavePolicy, "view"), c.list);
leaveRoutes.post(
  "/api/leaves/create",
  authorize(LeavePolicy, "create"),
  c.create,
);
leaveRoutes.patch(
  "/api/leaves/update/:id",
  authorize(LeavePolicy, "update"),
  c.decide,
);
leaveRoutes.delete(
  "/api/leaves/delete/:id",
  authorize(LeavePolicy, "delete"),
  c.remove,
);
