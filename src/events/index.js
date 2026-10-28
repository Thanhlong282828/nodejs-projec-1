import { EventEmitter } from "node:events";
import { Outbox } from "../models/index.js";
import { invalidate } from "../lib/redis.js";
export const events = new EventEmitter();
let io;
export const attachRealtime = (server) => {
  io = server;
};
// Outbox được INSERT cùng transaction; nếu Redis chết, business data/event vẫn được lưu cùng nhau.
export const recordEvent = (topic, payload, transaction) =>
  Outbox.create({ topic, payload }, { transaction });
// Event nội bộ sau commit: xóa cache và phát realtime; không gửi email ngay trong HTTP request.
events.on("committed", (event) => {
  if (!io || !event.companyId) return;
  // Re-resolve current DB permissions before sending, so revoked sessions receive nothing.
  for (const socket of io.of("/").sockets.values()) {
    void (async () => {
      try {
        const { resolveToken } = await import("../middleware/auth.js");
        const { can } = await import("../modules/access/permissions.js");
        const { user } = await resolveToken(socket.data.token);
        if (user.companyId !== event.companyId) return;
        const module = event.topic.split(".")[0];
        const permission = {
          employee: "employees.view",
          department: "departments.view",
          leave: "leaves.viewAll",
          attendance: "attendance.viewAll",
          access: "access.manage",
          company: "companies.view",
        }[module];
        if (
          user.id === event.employeeUserId ||
          (permission && can(user, permission))
        )
          socket.emit("hrm:changed", { topic: event.topic });
      } catch {
        socket.disconnect(true);
      }
    })();
  }
});

export async function publish(event) {
  await invalidate();
  events.emit("committed", event);
}
