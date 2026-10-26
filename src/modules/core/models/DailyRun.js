// Tương tự Eloquent Model trong module DJI; giữ nguyên bảng MySQL hiện có.
import { DataTypes as D } from "sequelize";
import { db } from "../../../lib/db.js";
import { modelOptions as options } from "../../../models/model-options.js";
export const DailyRun = db.define(
  "DailyRun",
  { id: { type: D.STRING(100), primaryKey: true } },
  options("hrm_daily_runs"),
);
