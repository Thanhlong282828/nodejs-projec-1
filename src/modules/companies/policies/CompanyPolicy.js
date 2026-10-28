import { can } from "../../access/permissions.js";
export const CompanyPolicy = {
  view: (user) => can(user, "companies.view"),
  create: (user) => user?.role === "admin" && can(user, "companies.create"),
  update: (user) => can(user, "companies.update"),
};
