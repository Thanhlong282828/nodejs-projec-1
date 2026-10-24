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
events.on("committed", ({ topic, employeeUserId }) => {
  io?.to("managers").emit("hrm:changed", { topic });
  if (employeeUserId)
    io?.to(`user-${employeeUserId}`).emit("hrm:changed", { topic });
});

export async function publish(event) {
  await invalidate();
  events.emit("committed", event);
}
