// Model registry: liên kết các model thuộc module, không chứa nghiệp vụ.
import { User } from "../modules/auth/models/User.js";
import { Department } from "../modules/departments/models/Department.js";
import { Employee } from "../modules/employees/models/Employee.js";
import { Leave } from "../modules/leaves/models/Leave.js";
import { Attendance } from "../modules/attendance/models/Attendance.js";
import { Audit } from "../modules/audit/models/Audit.js";
import { Outbox } from "../modules/core/models/Outbox.js";
import { DailyRun } from "../modules/core/models/DailyRun.js";
export {
  User,
  Employee,
  Department,
  Leave,
  Attendance,
  Audit,
  Outbox,
  DailyRun,
};
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
