import { Router } from "express";
import { authorize } from "../../../core/authorization.js";
import { AccessPolicy } from "../policies/AccessPolicy.js";
import * as c from "../controllers/AccessController.js";
export const apiRoutes = Router();
apiRoutes.get("/api/access/list", authorize(AccessPolicy, "manage"), c.list);
apiRoutes.post(
  "/api/roles/create",
  authorize(AccessPolicy, "manage"),
  c.create,
);
apiRoutes.put(
  "/api/roles/update/:id",
  authorize(AccessPolicy, "manage"),
  c.update,
);
apiRoutes.put(
  "/api/accounts/assign/:id",
  authorize(AccessPolicy, "manage"),
  c.assign,
);
