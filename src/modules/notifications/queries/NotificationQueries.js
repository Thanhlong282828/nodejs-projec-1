import { config } from "../../../config.js";
import { HttpError } from "../../../lib/http.js";
export class GetNotificationListQuery {
  constructor(actor) {
    this.actor = actor;
    Object.freeze(this);
  }
}
export const queryHandlers = [
  [
    GetNotificationListQuery,
    async ({ actor }) => {
      try {
        const response = await fetch(
          `${config.notificationUrl}/internal/messages/list?userId=${actor.id}`,
          {
            headers: { "x-internal-key": config.internalKey },
            signal: AbortSignal.timeout(3000),
          },
        );
        if (!response.ok)
          throw new HttpError(503, "Dịch vụ thông báo đang bận.");
        return (await response.json()).data;
      } catch (error) {
        if (error.status) throw error;
        throw new HttpError(503, "Dịch vụ thông báo tạm thời không sẵn sàng.");
      }
    },
  ],
];
