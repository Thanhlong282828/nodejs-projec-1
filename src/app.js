import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";
import { fileURLToPath } from "node:url";
import { db } from "./lib/db.js";
import { data, errors, HttpError } from "./lib/http.js";
import { authenticate, allow, csrf, sameOrigin } from "./middleware/auth.js";
import {
  safeUser,
  Audit,
  Outbox,
  User,
  Employee,
  Department,
} from "./models/index.js";
import { registerObservers } from "./observers/audit-observer.js";
import * as authController from "./modules/auth/controller.js";
import { employeeRoutes } from "./modules/employees/routes.js";
import { departmentRoutes } from "./modules/departments/routes.js";
import { leaveRoutes } from "./modules/leaves/routes.js";
import { attendanceRoutes } from "./modules/attendance/routes.js";
import { dashboard } from "./modules/dashboard/service.js";
import * as employees from "./modules/employees/service.js";
import * as leaves from "./modules/leaves/service.js";
import { queueStats } from "./queue/index.js";
import { paginationSchema } from "./lib/validation.js";
import { config } from "./config.js";
registerObservers();
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
app.get("/health", async (req, res) => {
  await db.authenticate();
  res.json({ status: "ok", service: "hrm-core" });
});
app.get("/login", (req, res) => res.render("login", { title: "Đăng nhập" }));
app.post(
  "/api/auth/login",
  sameOrigin,
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }),
  authController.login,
);
app.use(authenticate);
app.use(csrf);
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
app.post("/api/auth/logout", authController.logout);
app.get("/api/auth/me", (req, res) => data(res, safeUser(req.user)));
app.get("/api/dashboard", async (req, res) => {
  const result = await dashboard(req.user);
  res.set("X-Cache", result.cache);
  data(res, result.value);
});
app.use("/api/employees", employeeRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/attendance", attendanceRoutes);
app.get("/api/audit", allow("admin", "hr"), async (req, res) => {
  const q = paginationSchema.parse(req.query);
  const result = await Audit.findAndCountAll({
    order: [["id", "DESC"]],
    limit: 20,
    offset: (q.page - 1) * 20,
  });
  data(res, { items: result.rows, total: result.count, page: q.page });
});
async function getMessages(user) {
  const response = await fetch(
    `${config.notificationUrl}/internal/messages?userId=${user.id}`,
    {
      headers: { "x-internal-key": config.internalKey },
      signal: AbortSignal.timeout(3000),
    },
  );
  if (!response.ok) throw new HttpError(503, "Dịch vụ thông báo đang bận.");
  return (await response.json()).data;
}
app.get("/api/notifications", async (req, res) => {
  try {
    data(res, await getMessages(req.user));
  } catch (error) {
    if (error.status) throw error;
    throw new HttpError(503, "Dịch vụ thông báo tạm thời không sẵn sàng.");
  }
});
app.get("/api/system", allow("admin"), async (req, res) => {
  let queue;
  try {
    queue = await queueStats();
  } catch {
    queue = { unavailable: true };
  }
  data(res, {
    queue,
    pendingOutbox: await Outbox.count({ where: { status: "pending" } }),
    queuedOutbox: await Outbox.count({ where: { status: "queued" } }),
    timezone: "Asia/Ho_Chi_Minh",
  });
});
// Web controller: lấy dữ liệu từ cùng service với REST API rồi render EJS thành HTML.
app.get("/", async (req, res) => {
  const stats = await dashboard(req.user);
  let recent = [];
  if (req.user.role !== "employee")
    recent = (await employees.list({ page: 1 })).items.slice(0, 5);
  res.render("dashboard", {
    title: "Tổng quan",
    active: "dashboard",
    stats: stats.value,
    recent,
    cache: stats.cache,
  });
});
app.get("/employees", allow("admin", "hr"), async (req, res) =>
  res.render("employees", {
    title: "Nhân viên",
    active: "employees",
    result: await employees.list(req.query),
    departments: await Department.findAll({ order: [["name", "ASC"]] }),
    query: req.query,
  }),
);
app.get("/departments", allow("admin", "hr"), async (req, res) =>
  res.render("departments", {
    title: "Phòng ban",
    active: "departments",
    departments: await Department.findAll({
      include: { model: Employee, as: "employees", attributes: ["id"] },
      order: [["name", "ASC"]],
    }),
  }),
);
app.get("/leaves", async (req, res) =>
  res.render("leaves", {
    title: "Nghỉ phép",
    active: "leaves",
    result: await leaves.list(req.user, req.query),
    query: req.query,
  }),
);
app.get("/attendance", async (req, res) =>
  res.render("attendance", { title: "Chấm công", active: "attendance" }),
);
app.get("/notifications", async (req, res) => {
  let messages = [],
    notice = "";
  try {
    messages = await getMessages(req.user);
  } catch {
    notice = "Dịch vụ thông báo đang khởi động. Hãy thử lại sau.";
  }
  res.render("notifications", {
    title: "Thông báo",
    active: "notifications",
    messages,
    notice,
  });
});
app.get("/audit", allow("admin", "hr"), async (req, res) =>
  res.render("audit", {
    title: "Nhật ký thay đổi",
    active: "audit",
    rows: await Audit.findAll({ order: [["id", "DESC"]], limit: 50 }),
  }),
);
app.get("/system", allow("admin"), async (req, res) =>
  res.render("system", { title: "Hệ thống", active: "system" }),
);
app.use((req, res, next) =>
  next(new HttpError(404, "Không tìm thấy trang hoặc endpoint.")),
);
app.use(errors);
