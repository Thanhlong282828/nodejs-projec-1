import { can } from "../../access/permissions.js";
export const DepartmentPolicy = {
  view: (user) => can(user, "departments.view"),
  create: (user) => can(user, "departments.create"),
  update: (user) => can(user, "departments.update"),
  delete: (user) => can(user, "departments.delete"),
};
