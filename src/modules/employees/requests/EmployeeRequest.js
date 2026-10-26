// FormRequest của module: chỉ kiểm tra input, không truy vấn hoặc ghi DB.
import { z } from "zod";
import { str, id, roles } from "../../../lib/validation-primitives.js";
export const employeeSchema = z.object({
  name: str(),
  email: z
    .email()
    .max(191)
    .transform((s) => s.toLowerCase()),
  password: z
    .string()
    .min(10)
    .refine((s) => Buffer.byteLength(s) <= 72, "Tối đa 72 bytes"),
  role: z.enum(roles).default("employee"),
  code: str(30).regex(/^[A-Za-z0-9_-]+$/),
  departmentId: id,
  position: str(),
  phone: z.string().trim().max(30).default(""),
  joinedOn: z.iso.date(),
  salary: z.number().nonnegative().max(9999999999.99).multipleOf(0.01),
  status: z.enum(["active", "inactive"]).default("active"),
});
export const employeeUpdateSchema = employeeSchema
  .omit({ password: true })
  .extend({
    password: z
      .string()
      .min(10)
      .refine((s) => Buffer.byteLength(s) <= 72, "Tối đa 72 bytes")
      .optional(),
  });
