import { Queue } from "bullmq";
import { config } from "../config.js";
import { Outbox } from "../models/index.js";
let queue;
export function getQueue() {
  if (queue) return queue;
  queue = new Queue(config.queue, {
    connection: {
      ...config.redis,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    },
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: "exponential", delay: 1500 },
      removeOnComplete: { age: 7 * 86400, count: 1000 },
      removeOnFail: { age: 30 * 86400 },
    },
  });
  // Queue cũng phát error event; listener tránh process chết khi Redis ngừng.
  queue.on("error", (error) =>
    console.error("Queue unavailable:", error.message),
  );
  return queue;
}
// jobId=outbox UUID giúp chống thêm trùng khi dispatcher chạy lại sau sự cố.
export async function dispatch() {
  const rows = await Outbox.findAll({
    where: { status: "pending" },
    order: [["createdAt", "ASC"]],
    limit: 100,
  });
  let sent = 0;
  for (const row of rows) {
    await getQueue().add(
      row.topic,
      { eventId: row.id, topic: row.topic, ...row.payload },
      { jobId: row.id },
    );
    await row.update({ status: "queued" });
    sent++;
  }
  return sent;
}
export async function queueStats() {
  return getQueue().getJobCounts(
    "waiting",
    "active",
    "completed",
    "failed",
    "delayed",
  );
}
export async function closeQueue() {
  await queue?.close();
}
