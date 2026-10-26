// Tương tự Eloquent Model trong module DJI; giữ nguyên bảng MySQL hiện có.
import { DataTypes as D } from "sequelize";
import { db } from "../../../lib/db.js";
import { modelOptions as options } from "../../../models/model-options.js";
export const Audit = db.define(
  "Audit",
  {
    id: { type: D.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    actorId: D.INTEGER.UNSIGNED,
    entity: D.STRING(60),
    entityId: D.INTEGER.UNSIGNED,
    action: D.STRING(30),
    details: D.JSON,
  },
  options("hrm_audits"),
);
