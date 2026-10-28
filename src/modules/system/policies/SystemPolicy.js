import { can } from "../../access/permissions.js";
export const SystemPolicy = {
  view: (user) => can(user, "system.view"),
};
