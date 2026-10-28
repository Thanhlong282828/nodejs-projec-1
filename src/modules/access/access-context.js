import {
  UserPermission,
  Role,
  Permission,
  Company,
} from "../../models/index.js";
export async function loadAccess(user) {
  const [role, company, overrides] = await Promise.all([
    Role.findOne({
      where: { id: user.roleId, companyId: user.companyId },
      include: {
        model: Permission,
        as: "permissions",
        through: { attributes: [] },
      },
    }),
    Company.findByPk(user.companyId),
    UserPermission.findAll({ where: { userId: user.id } }),
  ]);
  if (!role || !company) return false;
  user.accessRole = role;
  user.company = company;
  const effective = new Set(role.permissions.map((p) => p.key));
  if (overrides.length) {
    const catalog = await Permission.findAll();
    const keys = new Map(catalog.map((p) => [p.id, p.key]));
    for (const override of overrides) {
      const key = keys.get(override.permissionId);
      if (override.allowed) effective.add(key);
      else effective.delete(key);
    }
  }
  user.permissions = [...effective].sort();
  return true;
}
