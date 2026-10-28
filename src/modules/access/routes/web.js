import { Router } from "express";
import { authorize } from "../../../core/authorization.js";
import { AccessPolicy } from "../policies/AccessPolicy.js";
import * as c from "../controllers/AccessController.js";
export const webRoutes = Router();
webRoutes.get("/access/list", authorize(AccessPolicy, "manage"), c.index);
