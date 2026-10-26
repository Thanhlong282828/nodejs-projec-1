// Tương tự ServiceProvider::register/boot của Laravel: wiring, không chứa nghiệp vụ.
import { queryBus, commandBus } from "../core/MessageBus.js";
import { registerObservers } from "../observers/audit-observer.js";
import { queryHandlers as employeesQueries } from "../modules/employees/queries/EmployeeQueries.js";
import { commandHandlers as employeesCommands } from "../modules/employees/commands/EmployeeCommands.js";
import { queryHandlers as departmentsQueries } from "../modules/departments/queries/DepartmentQueries.js";
import { commandHandlers as departmentsCommands } from "../modules/departments/commands/DepartmentCommands.js";
import { queryHandlers as leavesQueries } from "../modules/leaves/queries/LeaveQueries.js";
import { commandHandlers as leavesCommands } from "../modules/leaves/commands/LeaveCommands.js";
import { queryHandlers as attendanceQueries } from "../modules/attendance/queries/AttendanceQueries.js";
import { commandHandlers as attendanceCommands } from "../modules/attendance/commands/AttendanceCommands.js";
import { queryHandlers as authQueries } from "../modules/auth/queries/AuthQueries.js";
import { commandHandlers as authCommands } from "../modules/auth/commands/AuthCommands.js";
import { queryHandlers as dashboardQueries } from "../modules/dashboard/queries/DashboardQueries.js";
import { queryHandlers as auditQueries } from "../modules/audit/queries/AuditQueries.js";
import { queryHandlers as notificationsQueries } from "../modules/notifications/queries/NotificationQueries.js";
import { queryHandlers as systemQueries } from "../modules/system/queries/SystemQueries.js";
let booted = false;
export function bootHrm() {
  if (booted) return;
  for (const [type, handler] of employeesQueries)
    queryBus.register(type, handler);
  for (const [type, handler] of departmentsQueries)
    queryBus.register(type, handler);
  for (const [type, handler] of leavesQueries) queryBus.register(type, handler);
  for (const [type, handler] of attendanceQueries)
    queryBus.register(type, handler);
  for (const [type, handler] of authQueries) queryBus.register(type, handler);
  for (const [type, handler] of dashboardQueries)
    queryBus.register(type, handler);
  for (const [type, handler] of auditQueries) queryBus.register(type, handler);
  for (const [type, handler] of notificationsQueries)
    queryBus.register(type, handler);
  for (const [type, handler] of systemQueries) queryBus.register(type, handler);
  for (const [type, handler] of employeesCommands)
    commandBus.register(type, handler);
  for (const [type, handler] of departmentsCommands)
    commandBus.register(type, handler);
  for (const [type, handler] of leavesCommands)
    commandBus.register(type, handler);
  for (const [type, handler] of attendanceCommands)
    commandBus.register(type, handler);
  for (const [type, handler] of authCommands)
    commandBus.register(type, handler);
  registerObservers();
  booted = true;
}
