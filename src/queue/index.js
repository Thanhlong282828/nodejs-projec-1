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
// Web metrics must not expose counts of jobs from another company.
export async function queueStats(companyId) {
  if (!Number.isSafeInteger(companyId) || companyId < 1)
    throw new Error("Company scope required for queue metrics");
  const result = {};
  for (const state of ["waiting", "active", "completed", "failed", "delayed"]) {
    let start = 0;
    result[state] = 0;
    while (true) {
      const jobs = await getQueue().getJobs([state], start, start + 99);
      result[state] += jobs.filter(
        (job) => job.data.companyId === companyId,
      ).length;
      if (jobs.length < 100) break;
      start += 100;
    }
  }
  return result;
}
export async function closeQueue() {
  await queue?.close();
}
