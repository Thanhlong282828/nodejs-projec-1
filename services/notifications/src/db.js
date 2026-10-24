import { Sequelize, DataTypes as D } from "sequelize";
// DB riêng; service thông báo không đọc/ghi các bảng HRM core.
export const db = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    dialect: "mysql",
    logging: false,
  },
);
export const Message = db.define(
  "Message",
  {
    eventId: { type: D.UUID, primaryKey: true },
    userId: D.INTEGER.UNSIGNED,
    recipient: D.STRING(191),
    subject: D.STRING(255),
    text: D.TEXT,
    status: { type: D.ENUM("pending", "sent"), defaultValue: "pending" },
    sentAt: D.DATE,
  },
  { tableName: "notification_messages", timestamps: true, underscored: true },
);
