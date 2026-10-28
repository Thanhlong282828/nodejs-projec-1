import { Router } from "express";
import { authorize } from "../../../core/authorization.js";
import { CompanyPolicy } from "../policies/CompanyPolicy.js";
import * as c from "../controllers/CompanyController.js";
export const webRoutes = Router();
webRoutes.get("/companies/list", authorize(CompanyPolicy, "view"), c.index);
