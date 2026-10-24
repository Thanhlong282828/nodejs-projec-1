// Cấu hình được dùng cho server, CLI và scheduler. Mỗi process đọc cùng .env.
const required = [
  "DB_HOST",
  "DB_USER",
  "DB_PASSWORD",
  "DB_NAME",
  "JWT_SECRET",
  "INTERNAL_KEY",
];
for (const name of required)
  if (!process.env[name]) throw new Error(`Missing ${name}`);
if (process.env.JWT_SECRET.length < 32)
  throw new Error("JWT_SECRET must contain at least 32 characters");
export const config = {
  port: Number(process.env.PORT || 3057),
  host: process.env.HOST || "127.0.0.1",
  origin: process.env.APP_ORIGIN || "http://localhost:3057",
  secret: process.env.JWT_SECRET,
  secure: process.env.COOKIE_SECURE === "true",
  notificationUrl: process.env.NOTIFICATION_URL || "http://127.0.0.1:3058",
  internalKey: process.env.INTERNAL_KEY,
  queue: process.env.QUEUE_NAME || "week7-hrm-notifications",
  redis: {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT || 6387),
  },
  db: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    dialect: "mysql",
    logging: false,
    timezone: "+07:00",
    pool: { max: 8, min: 0, acquire: 10000, idle: 10000 },
  },
};
