import { Audit } from "../../../models/index.js";
import { paginationSchema } from "../../../lib/validation.js";
export class GetAuditListQuery {
  constructor(filters = {}) {
    this.filters = filters;
    Object.freeze(this);
  }
}
export class GetRecentAuditQuery {
  constructor() {
    Object.freeze(this);
  }
}
export const queryHandlers = [
  [
    GetAuditListQuery,
    async ({ filters }) => {
      const q = paginationSchema.parse(filters);
      const result = await Audit.findAndCountAll({
        order: [["id", "DESC"]],
        limit: 20,
        offset: (q.page - 1) * 20,
      });
      return { items: result.rows, total: result.count, page: q.page };
    },
  ],
  [
    GetRecentAuditQuery,
    () => Audit.findAll({ order: [["id", "DESC"]], limit: 50 }),
  ],
];
