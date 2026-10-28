import {
  Role,
  Permission,
  User,
  UserPermission,
} from "../../../models/index.js";
import { companyWhere } from "../../../core/tenant.js";
import { loadAccess } from "../access-context.js";
import { safeUser } from "../../../models/index.js";
export async function overview(actor) {
  const roles = await Role.findAll({
    where: companyWhere(actor),
    include: {
      model: Permission,
      as: "permissions",
      through: { attributes: [] },
    },
    order: [["id", "ASC"]],
  });
  const permissions = await Permission.findAll({ order: [["key", "ASC"]] });
  const users = await User.findAll({
    where: companyWhere(actor),
    attributes: [
      "id",
      "name",
      "email",
      "role",
      "roleId",
      "companyId",
      "active",
    ],
    order: [["id", "ASC"]],
  });
  const accounts = [];
  for (const user of users) {
    await loadAccess(user);
    accounts.push({
      ...safeUser(user),
      active: user.active,
      overrides: await UserPermission.findAll({ where: { userId: user.id } }),
    });
  }
  return { roles, permissions, accounts };
}
