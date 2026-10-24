import {
  Audit,
  Employee,
  Department,
  Leave,
  Attendance,
} from "../models/index.js";
// Observer (Sequelize hook) tự chạy sau thao tác ORM, trong cùng transaction với dữ liệu gốc.
// Chỉ ghi tên field thay đổi; không đưa password/token hoặc lương vào audit payload.
export function registerObservers() {
  for (const model of [Employee, Department, Leave, Attendance]) {
    for (const [hook, action] of [
      ["afterCreate", "created"],
      ["afterUpdate", "updated"],
      ["afterDestroy", "deleted"],
    ]) {
      model.addHook(hook, "audit", async (record, options) => {
        if (options.skipAudit) return;
        await Audit.create(
          {
            actorId: options.actorId || null,
            entity: model.name,
            entityId: record.id,
            action,
            details: {
              fields: Array.from(record._changed || []).filter(
                (k) => !["password", "salary"].includes(k),
              ),
            },
          },
          { transaction: options.transaction },
        );
      });
    }
  }
}
