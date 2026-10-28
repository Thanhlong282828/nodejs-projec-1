import { can } from "../../access/permissions.js";
export const AuditPolicy = {
  view: (user) => can(user, "audit.view"),
};
