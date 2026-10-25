import express from "express";
import { Worker } from "bullmq";
import nodemailer from "nodemailer";
import { timingSafeEqual } from "node:crypto";
import { db, Message } from "./db.js";
for (const key of [
  "DB_HOST",
  "DB_USER",
  "DB_PASSWORD",
  "DB_NAME",
  "INTERNAL_KEY",
])
  if (!process.env[key]) throw new Error(`Missing ${key}`);
await db.authenticate();
const mail = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "mailpit",
  port: Number(process.env.SMTP_PORT || 1025),
  secure: false,
  connectionTimeout: 5000,
  greetingTimeout: 5000,
  socketTimeout: 10000,
});
// Worker chạy độc lập. Retry/backoff được producer cấu hình khi thêm job vào Redis.
const worker = new Worker(
  process.env.QUEUE_NAME || "week7-hrm-notifications",
  async (job) => {
    const { eventId, userId, recipient, subject, text } = job.data;
    if (
      typeof eventId !== "string" ||
      !Number.isInteger(userId) ||
      typeof recipient !== "string" ||
      typeof subject !== "string" ||
      typeof text !== "string"
    )
      throw new Error("Invalid event contract");
    const [message] = await Message.findOrCreate({
      where: { eventId },
      defaults: { userId, recipient, subject, text, status: "pending" },
    });
    if (message.status === "sent") return { duplicate: true };
    // SMTP at-least-once: Message-ID cố định giúp nhận diện, không cam kết exactly-once.
    await mail.sendMail({
      from: process.env.MAIL_FROM || "PeopleFlow <no-reply@hrm.local>",
      to: recipient,
      subject,
      text,
      messageId: `<${eventId}@hrm.local>`,
    });
    await message.update({ status: "sent", sentAt: new Date() });
    return { sent: true, eventId };
  },
  {
    connection: {
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: Number(process.env.REDIS_PORT || 6387),
      maxRetriesPerRequest: null,
    },
    concurrency: 3,
  },
);
worker.on("completed", (job) => console.log("Mail delivered:", job.id));
worker.on("failed", (job, error) =>
  console.error("Mail retry/failure:", job?.id, error.message),
);
worker.on("error", (error) => console.error("Worker:", error.message));
const app = express();
app.disable("x-powered-by");
app.get("/health", async (req, res) => {
  try {
    await db.authenticate();
    res.json({
      status: "ok",
      service: "notifications",
      workerRunning: worker.isRunning(),
    });
  } catch {
    res.status(503).json({ error: "Database unavailable" });
  }
});
app.use("/internal", (req, res, next) => {
  const actual = req.get("x-internal-key") || "",
    expected = process.env.INTERNAL_KEY;
  if (
    Buffer.byteLength(actual) !== Buffer.byteLength(expected) ||
    !timingSafeEqual(Buffer.from(actual), Buffer.from(expected))
  )
    return res.status(401).json({ error: "Unauthorized service" });
  next();
});
app.get("/internal/messages/list", async (req, res) => {
  if (typeof req.query.userId !== "string" || !/^\d+$/.test(req.query.userId))
    return res.status(422).json({ error: "userId required" });
  res.json({
    data: await Message.findAll({
      where: { userId: Number(req.query.userId) },
      order: [["createdAt", "DESC"]],
      limit: 50,
    }),
  });
});
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ error: "Notification service error" });
});
const server = app.listen(
  Number(process.env.PORT || 3058),
  process.env.HOST || "127.0.0.1",
  () => console.log("Notification microservice ready"),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, async () => {
    await worker.close();
    server.close();
    await db.close();
    process.exit(0);
  });
