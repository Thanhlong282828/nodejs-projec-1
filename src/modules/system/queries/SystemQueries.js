import { db } from "../../../lib/db.js";
import { Outbox } from "../../../models/index.js";
import { queueStats } from "../../../queue/index.js";
export class GetSystemStatusQuery {
  constructor(actor) {
    this.actor = actor;
    Object.freeze(this);
  }
}
export class GetHealthQuery {}
export const queryHandlers = [
  [
    GetSystemStatusQuery,
    async ({ actor }) => {
      let queue;
      try {
        queue = await queueStats(actor.companyId);
      } catch {
        queue = { unavailable: true };
      }
      return {
        queue,
        pendingOutbox: await Outbox.count({
          where: { "payload.companyId": actor.companyId, status: "pending" },
        }),
        queuedOutbox: await Outbox.count({
          where: { "payload.companyId": actor.companyId, status: "queued" },
        }),
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
