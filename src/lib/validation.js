import { z } from "zod";
// parse() ném ZodError khi sai input; error middleware đổi thành 422.
const str = (max = 120) => z.string().trim().min(1).max(max);
const id = z.number().int().positive();
export const roles = ["admin", "hr", "employee"];
export const loginSchema = z.object({
  email: z
    .email()
    .max(191)
    .transform((s) => s.toLowerCase()),
  password: z.string().min(1).max(72),
});
export const departmentSchema = z.object({
  name: str(100),
  description: z.string().trim().max(500).default(""),
});
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
export const leaveSchema = z
  .object({
    type: z.enum(["annual", "sick", "unpaid"]),
    startDate: z.iso.date(),
    endDate: z.iso.date(),
    reason: str(1000),
  })
  .refine((v) => v.endDate >= v.startDate, {
    message: "Ngày kết thúc phải >= ngày bắt đầu",
    path: ["endDate"],
  });
export const decisionSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  note: z.string().trim().max(500).default(""),
});
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
