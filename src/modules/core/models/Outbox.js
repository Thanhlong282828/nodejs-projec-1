// Tương tự Eloquent Model trong module DJI; giữ nguyên bảng MySQL hiện có.
import { DataTypes as D } from "sequelize";
import { db } from "../../../lib/db.js";
import { modelOptions as options } from "../../../models/model-options.js";
export const Outbox = db.define(
  "Outbox",
  {
    id: { type: D.UUID, primaryKey: true, defaultValue: D.UUIDV4 },
    topic: D.STRING(100),
    payload: D.JSON,
    status: { type: D.ENUM("pending", "queued"), defaultValue: "pending" },
  },
  options("hrm_outbox"),
);
