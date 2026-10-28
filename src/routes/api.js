import { apiRoutes as companies } from "../modules/companies/routes/api.js";
import { apiRoutes as access } from "../modules/access/routes/api.js";
// Tương tự routes/api.php: chỉ ghép route của các module, không có logic nghiệp vụ.
import { Router } from "express";
export { publicApiRoutes } from "../modules/auth/routes/api.js";
import { employeeRoutes as employeesRoutes } from "../modules/employees/routes/api.js";
import { departmentRoutes as departmentsRoutes } from "../modules/departments/routes/api.js";
import { leaveRoutes as leavesRoutes } from "../modules/leaves/routes/api.js";
import { attendanceRoutes as attendanceRoutes } from "../modules/attendance/routes/api.js";
import { apiRoutes as authRoutes } from "../modules/auth/routes/api.js";
import { apiRoutes as dashboardRoutes } from "../modules/dashboard/routes/api.js";
import { apiRoutes as auditRoutes } from "../modules/audit/routes/api.js";
import { apiRoutes as notificationsRoutes } from "../modules/notifications/routes/api.js";
import { apiRoutes as systemRoutes } from "../modules/system/routes/api.js";
export const apiRoutes = Router();
apiRoutes.use(employeesRoutes);
apiRoutes.use(departmentsRoutes);
apiRoutes.use(leavesRoutes);
apiRoutes.use(attendanceRoutes);
apiRoutes.use(authRoutes);
apiRoutes.use(dashboardRoutes);
apiRoutes.use(auditRoutes);
apiRoutes.use(notificationsRoutes);
apiRoutes.use(systemRoutes);

apiRoutes.use(companies);
apiRoutes.use(access);
