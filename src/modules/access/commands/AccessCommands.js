import { db } from "../../../lib/db.js";
import {
  Role,
  Permission,
  RolePermission,
  UserPermission,
  User,
  Audit,
} from "../../../models/index.js";
import { companyWhere } from "../../../core/tenant.js";
import { parseId } from "../../../lib/validation.js";
import { HttpError } from "../../../lib/http.js";
import { roleSchema, assignmentSchema } from "../requests/AccessRequest.js";
import { AccessPolicy } from "../policies/AccessPolicy.js";
import { publish } from "../../../events/index.js";
function guard(actor) {
  companyWhere(actor);
  if (!AccessPolicy.manage(actor))
    throw new HttpError(403, "Chỉ quản trị được phân quyền.");
}
async function permissionIds(actor, keys, transaction) {
  const catalog = await Permission.findAll({ transaction });
  const map = new Map(catalog.map((p) => [p.key, p.id]));
  for (const key of keys)
    if (!map.has(key) || !actor.permissions.includes(key))
      throw new HttpError(
        422,
        "Quyền không hợp lệ hoặc vượt quyền người cấp: " + key,
      );
  return keys.map((key) => map.get(key));
}
async function saveRole(actor, id, input) {
  guard(actor);
  const values = roleSchema.parse(input);
  if (["admin", "hr", "employee"].includes(values.code) && !id)
    throw new HttpError(422, "Mã chức vụ hệ thống đã được dành riêng.");
  const result = await db.transaction(async (transaction) => {
    // Lock công ty làm mutex cho thay đổi role/account; thứ tự lock nhất quán.
    const { Company } = await import("../../../models/index.js");
    await Company.findByPk(actor.companyId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    let role;
    if (id) {
      role = await Role.findOne({
        where: { id: parseId(id), ...companyWhere(actor) },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!role) throw new HttpError(404, "Không tìm thấy chức vụ.");
      if (role.systemKey === "admin")
        throw new HttpError(422, "Chức vụ quản trị được bảo vệ.");
      if (!role.systemKey && ["admin", "hr", "employee"].includes(values.code))
        throw new HttpError(422, "Mã chức vụ hệ thống đã được dành riêng.");
      if (role.systemKey && values.code !== role.code)
        throw new HttpError(422, "Không đổi mã chức vụ hệ thống.");
    }
    const ids = await permissionIds(actor, values.permissions, transaction);
    if (role) {
      await role.update(
        { name: values.name, code: values.code },
        { transaction },
      );
      await RolePermission.destroy({ where: { roleId: role.id }, transaction });
    } else
      role = await Role.create(
        {
          companyId: actor.companyId,
          name: values.name,
          code: values.code,
          systemKey: null,
        },
        { transaction },
      );
    if (ids.length)
      await RolePermission.bulkCreate(
        ids.map((permissionId) => ({ roleId: role.id, permissionId })),
        { transaction },
      );
    // Phiên đang mở không giữ quyền cũ sau thay đổi role.
    await User.increment("tokenVersion", {
      where: { roleId: role.id },
      transaction,
    });
    await Audit.create(
      {
        companyId: actor.companyId,
        actorId: actor.id,
        entity: "Role",
        entityId: role.id,
        action: id ? "updated" : "created",
        details: { permissionKeys: values.permissions },
      },
      { transaction },
    );
    return role;
  });
  await publish({ companyId: actor.companyId, topic: "access.role-changed" });
  return result;
}
async function assign(actor, id, input) {
  guard(actor);
  const values = assignmentSchema.parse(input);
  if (parseId(id) === actor.id)
    throw new HttpError(
      422,
      "Không tự sửa chức vụ/quyền của tài khoản đang dùng.",
    );
  await db.transaction(async (transaction) => {
    const { Company } = await import("../../../models/index.js");
    await Company.findByPk(actor.companyId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    const user = await User.findOne({
      where: { id: parseId(id), ...companyWhere(actor) },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!user) throw new HttpError(404, "Không tìm thấy tài khoản.");
    if (user.role === "admin")
      throw new HttpError(
        422,
        "Tài khoản quản trị được bảo vệ; không sửa qua form phân quyền.",
      );
    const role = await Role.findOne({
      where: { id: values.roleId, ...companyWhere(actor) },
      transaction,
    });
    if (!role) throw new HttpError(422, "Chức vụ không thuộc công ty.");
    if (role.systemKey === "admin")
      throw new HttpError(
        422,
        "Không nâng lên quản trị qua phân quyền thông thường.",
      );
    const allowIds = await permissionIds(actor, values.allow, transaction),
      denyIds = await permissionIds(actor, values.deny, transaction);
    await user.update(
      {
        roleId: role.id,
        role: role.systemKey || "employee",
        tokenVersion: user.tokenVersion + 1,
      },
      { transaction },
    );
    await UserPermission.destroy({ where: { userId: user.id }, transaction });
    const overrides = [
      ...allowIds.map((permissionId) => ({
        userId: user.id,
        permissionId,
        allowed: true,
      })),
      ...denyIds.map((permissionId) => ({
        userId: user.id,
        permissionId,
        allowed: false,
      })),
    ];
    if (overrides.length)
      await UserPermission.bulkCreate(overrides, { transaction });
    await Audit.create(
      {
        companyId: actor.companyId,
        actorId: actor.id,
        entity: "UserAccess",
        entityId: user.id,
        action: "assigned",
        details: { roleId: role.id, allow: values.allow, deny: values.deny },
      },
      { transaction },
    );
  });
  await publish({
    companyId: actor.companyId,
    topic: "access.account-changed",
    employeeUserId: parseId(id),
  });
  return { assigned: true };
}
export class CreateRoleCommand {
  constructor(actor, input) {
    Object.assign(this, { actor, input });
    Object.freeze(this);
  }
}
export class UpdateRoleCommand {
  constructor(actor, id, input) {
    Object.assign(this, { actor, id, input });
    Object.freeze(this);
  }
}
export class AssignAccessCommand {
  constructor(actor, id, input) {
    Object.assign(this, { actor, id, input });
    Object.freeze(this);
  }
}
export const commandHandlers = [
  [CreateRoleCommand, ({ actor, input }) => saveRole(actor, null, input)],
  [UpdateRoleCommand, ({ actor, id, input }) => saveRole(actor, id, input)],
  [AssignAccessCommand, ({ actor, id, input }) => assign(actor, id, input)],
];
