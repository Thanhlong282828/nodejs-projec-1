// Tương tự Eloquent Model trong module DJI; giữ nguyên bảng MySQL hiện có.
import { DataTypes as D } from "sequelize";
import { db } from "../../../lib/db.js";
import { modelOptions as options } from "../../../models/model-options.js";
export const User = db.define(
  "User",
  {
    companyId: { type: D.INTEGER.UNSIGNED, allowNull: false },
    id: { type: D.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: D.STRING(120),
    email: { type: D.STRING(191), unique: true },
    password: D.STRING(255),
    roleId: { type: D.INTEGER.UNSIGNED, allowNull: false },
    role: D.ENUM("admin", "hr", "employee"),
    active: { type: D.BOOLEAN, defaultValue: true },
    tokenVersion: { type: D.INTEGER, defaultValue: 0 },
  },
  options("hrm_users"),
);
