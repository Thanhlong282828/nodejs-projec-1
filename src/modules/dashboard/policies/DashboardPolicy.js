import { can } from "../../access/permissions.js";
export const DashboardPolicy = { view: (user) => can(user, "dashboard.view") };
