// Tương tự Eloquent Model trong module DJI; giữ nguyên bảng MySQL hiện có.
import { DataTypes as D } from "sequelize";
import { db } from "../../../lib/db.js";
import { modelOptions as options } from "../../../models/model-options.js";
export const Attendance = db.define(
  "Attendance",
  {
    companyId: { type: D.INTEGER.UNSIGNED, allowNull: false },
    id: { type: D.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    employeeId: D.INTEGER.UNSIGNED,
    workDate: D.DATEONLY,
    checkIn: D.DATE,
    checkOut: D.DATE,
  },
  options("hrm_attendances"),
);
