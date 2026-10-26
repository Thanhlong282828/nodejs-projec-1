import { db } from "../../../lib/db.js";
import { Outbox } from "../../../models/index.js";
import { queueStats } from "../../../queue/index.js";
export class GetSystemStatusQuery {}
export class GetHealthQuery {}
export const queryHandlers = [
  [
    GetSystemStatusQuery,
    async () => {
      let queue;
      try {
        queue = await queueStats();
      } catch {
        queue = { unavailable: true };
      }
      return {
        queue,
        pendingOutbox: await Outbox.count({ where: { status: "pending" } }),
        queuedOutbox: await Outbox.count({ where: { status: "queued" } }),
        timezone: "Asia/Ho_Chi_Minh",
      };
    },
  ],
  [
    GetHealthQuery,
    async () => {
      await db.authenticate();
      return { status: "ok", service: "hrm-core" };
    },
  ],
];
