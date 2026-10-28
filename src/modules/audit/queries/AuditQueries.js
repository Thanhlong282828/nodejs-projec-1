import { companyWhere } from "../../../core/tenant.js";
import { Audit } from "../../../models/index.js";
import { paginationSchema } from "../../../lib/validation.js";
export class GetAuditListQuery {
  constructor(actor, filters = {}) {
    this.actor = actor;
    this.filters = filters;
    Object.freeze(this);
  }
}
export class GetRecentAuditQuery {
  constructor(actor) {
    this.actor = actor;
    Object.freeze(this);
  }
}
export const queryHandlers = [
  [
    GetAuditListQuery,
    async ({ actor, filters }) => {
      const q = paginationSchema.parse(filters);
      const result = await Audit.findAndCountAll({
        where: companyWhere(actor),
        order: [["id", "DESC"]],
        limit: 20,
        offset: (q.page - 1) * 20,
      });
      return { items: result.rows, total: result.count, page: q.page };
    },
  ],
  [
    GetRecentAuditQuery,
    ({ actor }) =>
      Audit.findAll({
        where: companyWhere(actor),
        order: [["id", "DESC"]],
        limit: 50,
      }),
  ],
];
