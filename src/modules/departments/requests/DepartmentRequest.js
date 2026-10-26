// FormRequest của module: chỉ kiểm tra input, không truy vấn hoặc ghi DB.
import { z } from "zod";
import { str } from "../../../lib/validation-primitives.js";
export const departmentSchema = z.object({
  name: str(100),
  description: z.string().trim().max(500).default(""),
});
