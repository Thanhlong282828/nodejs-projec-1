import {
  Employee,
  Department,
  Leave,
  Attendance,
} from "../../../models/index.js";
import { companyWhere } from "../../../core/tenant.js";
import { can } from "../../access/permissions.js";
import { cached } from "../../../lib/redis.js";
import { workDate } from "../../../lib/dates.js";
async function dashboard(user) {
  const where = companyWhere(user),
    employeeId = user.employee?.id || 0;
  const load = async () => ({
    employees: await Employee.count({
      where: {
        ...where,
        status: "active",
        ...(!can(user, "employees.view") ? { userId: user.id } : {}),
      },
    }),
    departments: can(user, "departments.view")
      ? await Department.count({ where })
      : 0,
    pendingLeaves: can(user, "leaves.view")
      ? await Leave.count({
          where: {
            ...where,
            status: "pending",
            ...(!can(user, "leaves.viewAll") ? { employeeId } : {}),
          },
        })
      : 0,
    presentToday: can(user, "attendance.view")
      ? await Attendance.count({
          where: {
            ...where,
            workDate: workDate(),
            ...(!can(user, "attendance.viewAll") ? { employeeId } : {}),
          },
        })
      : 0,
  });
  // Include effective permission scope so role/override changes cannot reuse broader cache.
  return cached(
    `dashboard:${user.companyId}:${user.id}:${user.permissions.join(",")}`,
    30,
    load,
  );
}
export class GetDashboardQuery {
  constructor(actor) {
    this.actor = actor;
    Object.freeze(this);
  }
}
export const queryHandlers = [
  [GetDashboardQuery, ({ actor }) => dashboard(actor)],
];
