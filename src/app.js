// Composition root giống bootstrap/app.php: cấu hình middleware và gắn routes.
import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "node:url";
import { errors, HttpError } from "./lib/http.js";
import { authenticate, csrf } from "./middleware/auth.js";
import { bootHrm } from "./providers/HrmServiceProvider.js";
import { apiRoutes, publicApiRoutes } from "./routes/api.js";
import { webRoutes, publicWebRoutes } from "./routes/web.js";
bootHrm();
export const app = express();
app.disable("x-powered-by");
app.set("view engine", "ejs");
app.set("views", fileURLToPath(new URL("./views", import.meta.url)));
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        connectSrc: ["'self'"],
        imgSrc: ["'self'", "data:"],
        upgradeInsecureRequests: null,
      },
    },
  }),
);
app.use(express.json({ limit: "64kb" }));
app.use(express.urlencoded({ extended: false, limit: "64kb" }));
app.use(cookieParser());
app.use(express.static(fileURLToPath(new URL("../public", import.meta.url))));
app.use((req, res, next) => {
  res.locals.user = null;
  res.locals.csrf = "";
  res.locals.active = "";
  res.locals.title = "PeopleFlow";
  next();
});
app.use(publicWebRoutes);
app.use(publicApiRoutes);
app.use(authenticate);
app.use(csrf);
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
app.use(apiRoutes);
app.use(webRoutes);
app.use((req, res, next) =>
  next(new HttpError(404, "Không tìm thấy trang hoặc endpoint.")),
);
app.use(errors);
