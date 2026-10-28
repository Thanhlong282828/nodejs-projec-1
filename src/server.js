import { createServer } from "node:http";
import { Server } from "socket.io";
import { app } from "./app.js";
import { config } from "./config.js";
import { resolveToken } from "./middleware/auth.js";
import { attachRealtime } from "./events/index.js";
import { db } from "./lib/db.js";
import { redis } from "./lib/redis.js";
import { closeQueue } from "./queue/index.js";
export function createHttpServer() {
  const server = createServer(app);
  const io = new Server(server, {
    allowRequest: (req, done) =>
      done(null, !req.headers.origin || req.headers.origin === config.origin),
  });
  // Socket xác thực bằng DB; event được lọc company và permission trước khi gửi.
  io.use(async (socket, next) => {
    try {
      const cookie = (socket.request.headers.cookie || "")
        .split(";")
        .map((v) => v.trim())
        .find((v) => v.startsWith("hrm_token="));
      const token =
        socket.handshake.auth?.token ||
        (cookie ? decodeURIComponent(cookie.slice(10)) : null);
      if (!token) throw new Error("Missing token");
      const resolved = await resolveToken(token);
      socket.data.user = resolved.user;
      socket.data.token = token;
      socket.data.expiresAt = resolved.claims.exp;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });
  io.on("connection", (socket) => {
    const user = socket.data.user;
    socket.join(`user-${user.id}`);
    socket.join(`company-${user.companyId}`);
    const timer = setTimeout(
      () => socket.disconnect(true),
      Math.max(0, socket.data.expiresAt * 1000 - Date.now()),
    );
    // Recheck role/version để socket cũ không giữ quyền sau logout hoặc vô hiệu hóa.
    const interval = setInterval(async () => {
      try {
        const current = await resolveToken(
          socket.handshake.auth?.token ||
            decodeURIComponent(
              (socket.request.headers.cookie || "")
                .split(";")
                .map((v) => v.trim())
                .find((v) => v.startsWith("hrm_token="))
                ?.slice(10) || "",
            ),
        );
        if (current.user.role !== user.role) socket.disconnect(true);
      } catch {
        socket.disconnect(true);
      }
    }, 15000);
    socket.on("disconnect", () => {
      clearTimeout(timer);
      clearInterval(interval);
    });
  });
  attachRealtime(io);
  return { server, io };
}
if (process.argv[1] === new URL(import.meta.url).pathname) {
  await db.authenticate();
  const { server, io } = createHttpServer();
  server.listen(config.port, config.host, () =>
    console.log(`PeopleFlow HRM http://localhost:${config.port}`),
  );
  for (const signal of ["SIGINT", "SIGTERM"])
    process.on(signal, () => {
      io.close();
      server.close(async () => {
        await closeQueue();
        redis.disconnect();
        await db.close();
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 5000).unref();
    });
}
