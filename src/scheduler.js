import cron from "node-cron";
import { db } from "./lib/db.js";
import { redis } from "./lib/redis.js";
import { closeQueue, dispatch } from "./queue/index.js";
import { dailyDigest } from "./scheduler-jobs.js";
await db.authenticate();
let running = false;
const relay = async () => {
  if (running) return;
  running = true;
  try {
    const count = await dispatch();
    if (count) console.log("Outbox dispatched:", count);
  } catch (error) {
    console.error("Dispatch will retry:", error.message);
  } finally {
    running = false;
  }
};
// Scheduler chạy process riêng; không nhân đôi lịch khi scale web app.
const outboxTask = cron.schedule("*/10 * * * * *", relay);
const digestTask = cron.schedule(
  "0 8 * * 1-5",
  () => dailyDigest().catch(console.error),
  { timezone: "Asia/Ho_Chi_Minh" },
);
await relay();
console.log(
  "Scheduler ready: relay every 10 seconds, digest 08:00 weekdays Asia/Ho_Chi_Minh",
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, async () => {
    outboxTask.stop();
    digestTask.stop();
    await closeQueue();
    redis.disconnect();
    await db.close();
    process.exit(0);
  });
