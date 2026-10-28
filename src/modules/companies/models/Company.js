import { DataTypes as D } from "sequelize";
import { db } from "../../../lib/db.js";
import { modelOptions } from "../../../models/model-options.js";
export const Company = db.define(
  "Company",
  {
    id: { type: D.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    name: { type: D.STRING(150), allowNull: false },
    code: { type: D.STRING(40), allowNull: false, unique: true },
    address: D.STRING(300),
    email: D.STRING(191),
  },
  modelOptions("hrm_companies"),
);
