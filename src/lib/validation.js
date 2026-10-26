// Facade giữ import tương thích; quy tắc FormRequest nằm trong từng module.
import { z } from "zod";
export { roles } from "./validation-primitives.js";
export { loginSchema } from "../modules/auth/requests/LoginRequest.js";
export { departmentSchema } from "../modules/departments/requests/DepartmentRequest.js";
export {
  employeeSchema,
  employeeUpdateSchema,
} from "../modules/employees/requests/EmployeeRequest.js";
export {
  leaveSchema,
  decisionSchema,
} from "../modules/leaves/requests/LeaveRequest.js";
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  search: z.string().max(100).default(""),
  departmentId: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.coerce.number().int().positive().optional(),
  ),
  status: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.enum(["pending", "approved", "rejected"]).optional(),
  ),
});
export const parseId = (value) =>
  z.coerce.number().int().positive().safe().parse(value);
