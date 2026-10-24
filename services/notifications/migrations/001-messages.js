import { DataTypes as D } from "sequelize";
export const up = async ({ context: q }) => {
  await q.createTable("notification_messages", {
    event_id: { type: D.UUID, primaryKey: true },
    user_id: { type: D.INTEGER.UNSIGNED, allowNull: false },
    recipient: { type: D.STRING(191), allowNull: false },
    subject: { type: D.STRING(255), allowNull: false },
    text: { type: D.TEXT, allowNull: false },
    status: {
      type: D.ENUM("pending", "sent"),
      allowNull: false,
      defaultValue: "pending",
    },
    sent_at: D.DATE,
    created_at: { type: D.DATE, allowNull: false },
    updated_at: { type: D.DATE, allowNull: false },
  });
  await q.addIndex("notification_messages", ["user_id", "created_at"]);
};
export const down = async ({ context: q }) =>
  q.dropTable("notification_messages");
