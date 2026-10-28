import { can } from "../../access/permissions.js";
export const AttendancePolicy = {
  view: (user) => can(user, "attendance.view"),
  checkIn: (user) => can(user, "attendance.checkIn"),
  checkOut: (user) => can(user, "attendance.checkOut"),
};
