import { Router } from "express";
import { authorize } from "../../../core/authorization.js";
import { CompanyPolicy } from "../policies/CompanyPolicy.js";
import * as c from "../controllers/CompanyController.js";
export const apiRoutes = Router();
apiRoutes.get("/api/companies/list", authorize(CompanyPolicy, "view"), c.list);
apiRoutes.get(
  "/api/companies/detail/:id",
  authorize(CompanyPolicy, "view"),
  c.get,
);
apiRoutes.post(
  "/api/companies/create",
  authorize(CompanyPolicy, "create"),
  c.create,
);
apiRoutes.put(
  "/api/companies/update/:id",
  authorize(CompanyPolicy, "update"),
  c.update,
);
