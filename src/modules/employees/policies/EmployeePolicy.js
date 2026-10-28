import { can } from "../../access/permissions.js";
export const EmployeePolicy = {
  view: (user) => can(user, "employees.view"),
  create: (user) => can(user, "employees.create"),
  update: (user) => can(user, "employees.update"),
  delete: (user) => can(user, "employees.delete"),
};
