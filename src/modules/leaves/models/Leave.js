// Tương tự Eloquent Model trong module DJI; giữ nguyên bảng MySQL hiện có.
import { DataTypes as D } from "sequelize";
import { db } from "../../../lib/db.js";
import { modelOptions as options } from "../../../models/model-options.js";
export const Leave = db.define(
  "Leave",
  {
    id: { type: D.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    employeeId: D.INTEGER.UNSIGNED,
    type: D.ENUM("annual", "sick", "unpaid"),
    startDate: D.DATEONLY,
    endDate: D.DATEONLY,
    reason: D.TEXT,
    status: {
      type: D.ENUM("pending", "approved", "rejected"),
      defaultValue: "pending",
    },
    reviewedBy: D.INTEGER.UNSIGNED,
    note: D.STRING(500),
  },
  options("hrm_leaves"),
);
