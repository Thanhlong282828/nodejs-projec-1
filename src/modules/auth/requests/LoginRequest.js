// FormRequest của module: chỉ kiểm tra input, không truy vấn hoặc ghi DB.
import { z } from "zod";
export const loginSchema = z.object({
  email: z
    .email()
    .max(191)
    .transform((s) => s.toLowerCase()),
  password: z.string().min(1).max(72),
});
