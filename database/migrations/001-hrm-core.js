import { DataTypes as D } from "sequelize";
// Migration chạy đúng một lần; SequelizeMeta lưu tên migration đã áp dụng.
export async function up({ context: q }) {
  const id = {
    type: D.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  };
  const stamps = {
    created_at: { type: D.DATE, allowNull: false },
    updated_at: { type: D.DATE, allowNull: false },
  };
  const fk = (table) => ({
    type: D.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: table, key: "id" },
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  });
  await q.createTable("hrm_users", {
    id,
    name: { type: D.STRING(120), allowNull: false },
    email: { type: D.STRING(191), unique: true, allowNull: false },
    password: { type: D.STRING(255), allowNull: false },
    role: {
      type: D.ENUM("admin", "hr", "employee"),
      allowNull: false,
      defaultValue: "employee",
    },
    active: { type: D.BOOLEAN, allowNull: false, defaultValue: true },
    token_version: { type: D.INTEGER, allowNull: false, defaultValue: 0 },
    ...stamps,
  });
  await q.createTable("hrm_departments", {
    id,
    name: { type: D.STRING(100), unique: true, allowNull: false },
    description: D.STRING(500),
    ...stamps,
  });
  await q.createTable("hrm_employees", {
    id,
    code: { type: D.STRING(30), unique: true, allowNull: false },
    user_id: { ...fk("hrm_users"), unique: true },
    department_id: fk("hrm_departments"),
    position: { type: D.STRING(120), allowNull: false },
    phone: D.STRING(30),
    joined_on: { type: D.DATEONLY, allowNull: false },
    salary: { type: D.DECIMAL(12, 2), allowNull: false },
    status: {
      type: D.ENUM("active", "inactive"),
      allowNull: false,
      defaultValue: "active",
    },
    ...stamps,
  });
  await q.createTable("hrm_leaves", {
    id,
    employee_id: fk("hrm_employees"),
    type: { type: D.ENUM("annual", "sick", "unpaid"), allowNull: false },
    start_date: { type: D.DATEONLY, allowNull: false },
    end_date: { type: D.DATEONLY, allowNull: false },
    reason: { type: D.TEXT, allowNull: false },
    status: {
      type: D.ENUM("pending", "approved", "rejected"),
      allowNull: false,
      defaultValue: "pending",
    },
    reviewed_by: { ...fk("hrm_users"), allowNull: true },
    note: D.STRING(500),
    ...stamps,
  });
  await q.addIndex("hrm_leaves", ["employee_id", "status", "start_date"]);
  await q.createTable("hrm_attendances", {
    id,
    employee_id: fk("hrm_employees"),
    work_date: { type: D.DATEONLY, allowNull: false },
    check_in: { type: D.DATE, allowNull: false },
    check_out: D.DATE,
    ...stamps,
  });
  await q.addIndex("hrm_attendances", ["employee_id", "work_date"], {
    unique: true,
    name: "attendance_employee_day",
  });
  await q.createTable("hrm_audits", {
    id,
    actor_id: { ...fk("hrm_users"), allowNull: true },
    entity: { type: D.STRING(60), allowNull: false },
    entity_id: { type: D.INTEGER.UNSIGNED, allowNull: false },
    action: { type: D.STRING(30), allowNull: false },
    details: D.JSON,
    ...stamps,
  });
  await q.createTable("hrm_outbox", {
    id: { type: D.UUID, primaryKey: true },
    topic: { type: D.STRING(100), allowNull: false },
    payload: { type: D.JSON, allowNull: false },
    status: {
      type: D.ENUM("pending", "queued"),
      allowNull: false,
      defaultValue: "pending",
    },
    ...stamps,
  });
  await q.addIndex("hrm_outbox", ["status", "created_at"]);
  await q.createTable("hrm_daily_runs", {
    id: { type: D.STRING(100), primaryKey: true },
    ...stamps,
  });
}
export async function down({ context: q }) {
  for (const table of [
    "hrm_daily_runs",
    "hrm_outbox",
    "hrm_audits",
    "hrm_attendances",
    "hrm_leaves",
    "hrm_employees",
    "hrm_departments",
    "hrm_users",
  ])
    await q.dropTable(table);
}
