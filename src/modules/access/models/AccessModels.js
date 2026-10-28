import { DataTypes as D } from "sequelize";
import { db } from "../../../lib/db.js";
import { modelOptions } from "../../../models/model-options.js";
const id = { type: D.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true };
export const Role = db.define(
  "Role",
  {
    id,
    companyId: { type: D.INTEGER.UNSIGNED, allowNull: false },
    name: D.STRING(120),
    code: D.STRING(60),
    systemKey: { type: D.ENUM("admin", "hr", "employee"), allowNull: true },
  },
  modelOptions("hrm_roles"),
);
export const Permission = db.define(
  "Permission",
  { id, key: { type: D.STRING(80), unique: true }, name: D.STRING(150) },
  modelOptions("hrm_permissions"),
);
export const RolePermission = db.define(
  "RolePermission",
  {
    roleId: { type: D.INTEGER.UNSIGNED, primaryKey: true },
    permissionId: { type: D.INTEGER.UNSIGNED, primaryKey: true },
  },
  { tableName: "hrm_role_permissions", underscored: true, timestamps: false },
);
export const UserPermission = db.define(
  "UserPermission",
  {
    userId: { type: D.INTEGER.UNSIGNED, primaryKey: true },
    permissionId: { type: D.INTEGER.UNSIGNED, primaryKey: true },
    allowed: { type: D.BOOLEAN, allowNull: false },
  },
  { tableName: "hrm_user_permissions", underscored: true, timestamps: false },
);
