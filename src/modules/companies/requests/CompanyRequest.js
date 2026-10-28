import { z } from "zod";
export const companySchema = z.object({
  name: z.string().trim().min(2).max(150),
  code: z
    .string()
    .trim()
    .regex(/^[A-Z0-9_-]{2,40}$/),
  address: z.string().trim().max(300).default(""),
  email: z.email().max(191),
});
export const createCompanySchema = companySchema.extend({
  adminName: z.string().trim().min(2).max(120),
  adminEmail: z
    .email()
    .max(191)
    .transform((s) => s.toLowerCase()),
  adminPassword: z
    .string()
    .min(10)
    .refine((s) => Buffer.byteLength(s) <= 72, "Tối đa 72 bytes"),
});
