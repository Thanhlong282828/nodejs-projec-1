import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { sameOrigin } from "../../../middleware/auth.js";
import * as controller from "../controllers/AuthController.js";
export const publicApiRoutes = Router();
publicApiRoutes.post(
  "/api/auth/login",
  sameOrigin,
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }),
  controller.login,
);
export const apiRoutes = Router();
apiRoutes.post("/api/auth/logout", controller.logout);
apiRoutes.get("/api/auth/profile", controller.profile);
