import { can } from "../permissions.js";
// Quyền quản trị bảo mật được bảo vệ thêm: role legacy admin + access.manage.
export const AccessPolicy = {
  manage: (user) => user?.role === "admin" && can(user, "access.manage"),
};
