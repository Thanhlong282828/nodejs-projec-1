import { z } from "zod";
const permissionKeys = z
  .array(z.string().max(80))
  .max(100)
  .refine((v) => new Set(v).size === v.length, "Không lặp quyền");
export const roleSchema = z.object({
  name: z.string().trim().min(2).max(120),
  code: z.string().regex(/^[a-z][a-z0-9_-]{1,59}$/),
  permissions: permissionKeys,
});
export const assignmentSchema = z
  .object({
    roleId: z.number().int().positive(),
    allow: permissionKeys.default([]),
    deny: permissionKeys.default([]),
  })
  .refine(
    (v) => !v.allow.some((k) => v.deny.includes(k)),
    "Không vừa cấp vừa thu hồi cùng quyền",
  );
