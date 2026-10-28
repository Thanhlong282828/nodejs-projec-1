import { can } from "../../access/permissions.js";
export const LeavePolicy = {
  view: (user) => can(user, "leaves.view"),
  create: (user) => can(user, "leaves.create"),
  update: (user) => can(user, "leaves.update"),
  delete: (user) => can(user, "leaves.delete"),
};
