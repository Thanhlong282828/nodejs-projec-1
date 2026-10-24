import { DataTypes as D } from "sequelize";
import { db } from "../lib/db.js";
const options = (tableName) => ({
  tableName,
  timestamps: true,
  underscored: true,
});
// Model là lớp ORM. Association cho phép include phòng ban/user khi lấy nhân viên.
export const User = db.define(
  "User",
  {
    id: { type: D.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: D.STRING(120),
    email: { type: D.STRING(191), unique: true },
    password: D.STRING(255),
    role: D.ENUM("admin", "hr", "employee"),
    active: { type: D.BOOLEAN, defaultValue: true },
    tokenVersion: { type: D.INTEGER, defaultValue: 0 },
  },
  options("hrm_users"),
);
export const Department = db.define(
  "Department",
  {
    id: { type: D.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { type: D.STRING(100), unique: true },
    description: D.STRING(500),
  },
  options("hrm_departments"),
);
export const Employee = db.define(
  "Employee",
  {
    id: { type: D.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    code: { type: D.STRING(30), unique: true },
    userId: { type: D.INTEGER.UNSIGNED, unique: true },
    departmentId: D.INTEGER.UNSIGNED,
    position: D.STRING(120),
    phone: D.STRING(30),
    joinedOn: D.DATEONLY,
    salary: D.DECIMAL(12, 2),
    status: D.ENUM("active", "inactive"),
  },
  options("hrm_employees"),
);
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
export const Attendance = db.define(
  "Attendance",
  {
    id: { type: D.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    employeeId: D.INTEGER.UNSIGNED,
    workDate: D.DATEONLY,
    checkIn: D.DATE,
    checkOut: D.DATE,
  },
  options("hrm_attendances"),
);
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
export const DailyRun = db.define(
  "DailyRun",
  { id: { type: D.STRING(100), primaryKey: true } },
  options("hrm_daily_runs"),
);
User.hasOne(Employee, { foreignKey: "userId", as: "employee" });
Employee.belongsTo(User, { foreignKey: "userId", as: "user" });
Department.hasMany(Employee, { foreignKey: "departmentId", as: "employees" });
Employee.belongsTo(Department, {
  foreignKey: "departmentId",
  as: "department",
});
Employee.hasMany(Leave, { foreignKey: "employeeId", as: "leaves" });
Leave.belongsTo(Employee, { foreignKey: "employeeId", as: "employee" });
Employee.hasMany(Attendance, { foreignKey: "employeeId", as: "attendances" });
Attendance.belongsTo(Employee, { foreignKey: "employeeId", as: "employee" });
Leave.belongsTo(User, { foreignKey: "reviewedBy", as: "reviewer" });
export const safeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  employeeId: user.employee?.id || null,
});
