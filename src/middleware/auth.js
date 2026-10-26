import jwt from "jsonwebtoken";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { User, Employee, safeUser } from "../models/index.js";
import { config } from "../config.js";
import { HttpError } from "../lib/http.js";
export function issueToken(user) {
  const csrf = randomBytes(24).toString("hex");
  return {
    token: jwt.sign({ version: user.tokenVersion, csrf }, config.secret, {
      subject: String(user.id),
      issuer: "week7-hrm",
      audience: "hrm-web-api",
      expiresIn: "8h",
    }),
    csrf,
  };
}
export async function resolveToken(token) {
  let claims;
  try {
    claims = jwt.verify(token, config.secret, {
      algorithms: ["HS256"],
      issuer: "week7-hrm",
      audience: "hrm-web-api",
    });
  } catch {
    throw new HttpError(401, "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.");
  }
  const user = await User.findByPk(claims.sub, {
    include: { model: Employee, as: "employee" },
  });
  if (!user || !user.active || user.tokenVersion !== claims.version)
    throw new HttpError(
      401,
      "Tài khoản hoặc phiên đăng nhập đã bị vô hiệu hóa.",
    );
  if (user.role === "employee" && !user.employee)
    throw new HttpError(403, "Tài khoản chưa có hồ sơ nhân viên.");
  return { user, claims };
}
export async function authenticate(req, res, next) {
  const bearer = /^Bearer (\S+)$/.exec(req.headers.authorization || "");
  const token = bearer?.[1] || req.cookies?.hrm_token;
  if (!token) {
    if (!req.path.startsWith("/api")) return res.redirect("/login");
    throw new HttpError(401, "Bạn cần đăng nhập.");
  }
  const resolved = await resolveToken(token);
  req.user = resolved.user;
  req.claims = resolved.claims;
  req.isBearer = Boolean(bearer);
  res.locals.user = safeUser(req.user);
  res.locals.csrf = resolved.claims.csrf;
  next();
}
export function csrf(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method) || req.isBearer)
    return next();
  const actual = req.get("x-csrf-token") || req.body?._csrf || "",
    expected = req.claims?.csrf || "";
  if (
    !expected ||
    typeof actual !== "string" ||
    Buffer.byteLength(actual) !== Buffer.byteLength(expected) ||
    !timingSafeEqual(Buffer.from(actual), Buffer.from(expected))
  )
    throw new HttpError(
      403,
      "CSRF token không hợp lệ. Vui lòng tải lại trang.",
    );
  next();
}
export function sameOrigin(req, res, next) {
  const origin = req.get("origin");
  if (origin && origin !== config.origin)
    throw new HttpError(403, "Origin không được phép.");
  next();
}
