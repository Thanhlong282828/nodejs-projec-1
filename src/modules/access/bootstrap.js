import { Role, Permission, RolePermission } from "../../models/index.js";
import { defaultRoles } from "./permissions.js";
// Dùng khi tạo công ty và seed, không chạy trên mỗi request.
export async function createCompanyRoles(companyId, transaction) {
  const catalog = await Permission.findAll({ transaction });
  const ids = new Map(catalog.map((p) => [p.key, p.id]));
  const roles = {};
  for (const [code, spec] of Object.entries(defaultRoles)) {
    const [role, created] = await Role.findOrCreate({
      where: { companyId, code },
      defaults: { name: spec.name, systemKey: code },
      transaction,
    });
    if (created)
      await RolePermission.bulkCreate(
        spec.permissions.map((key) => ({
          roleId: role.id,
          permissionId: ids.get(key),
        })),
        { transaction },
      );
    roles[code] = role;
  }
  return roles;
}
