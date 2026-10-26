// Service kiểm tra nghiệp vụ, gọi model Sequelize và giữ các thay đổi liên quan trong transaction.
import { Op } from "sequelize";
import {
  Employee,
  Department,
  Leave,
  Attendance,
} from "../../../models/index.js";
import { cached } from "../../../lib/redis.js";
import { workDate } from "../../../lib/dates.js";
async function dashboard(user) {
  if (user.role === "employee") {
    const employeeId = user.employee.id;
    return {
      value: {
        employees: 1,
        departments: 1,
        pendingLeaves: await Leave.count({
          where: { employeeId, status: "pending" },
        }),
        presentToday: await Attendance.count({
          where: { employeeId, workDate: workDate() },
        }),
      },
      cache: "BYPASS",
    };
  }
  return cached("dashboard", 30, async () => ({
    employees: await Employee.count({ where: { status: "active" } }),
    departments: await Department.count(),
    pendingLeaves: await Leave.count({ where: { status: "pending" } }),
    presentToday: await Attendance.count({ where: { workDate: workDate() } }),
  }));
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
