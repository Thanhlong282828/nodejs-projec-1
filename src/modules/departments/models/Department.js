// Tương tự Eloquent Model trong module DJI; giữ nguyên bảng MySQL hiện có.
import { DataTypes as D } from "sequelize";
import { db } from "../../../lib/db.js";
import { modelOptions as options } from "../../../models/model-options.js";
export const Department = db.define(
  "Department",
  {
    id: { type: D.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { type: D.STRING(100), unique: true },
    description: D.STRING(500),
  },
  options("hrm_departments"),
);
