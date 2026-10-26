// Tương tự Eloquent Model trong module DJI; giữ nguyên bảng MySQL hiện có.
import { DataTypes as D } from "sequelize";
import { db } from "../../../lib/db.js";
import { modelOptions as options } from "../../../models/model-options.js";
export const Employee = db.define(
  "Employee",
  {
    id: { type: D.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    code: { type: D.STRING(30), unique: true },
    userId: { type: D.INTEGER.UNSIGNED, unique: true },
    departmentId: D.INTEGER.UNSIGNED,
    position: D.STRING(120),
    phone: D.STRING(30),
    joinedOn: D.DATEONLY,
    salary: D.DECIMAL(12, 2),
    status: D.ENUM("active", "inactive"),
  },
  options("hrm_employees"),
);
