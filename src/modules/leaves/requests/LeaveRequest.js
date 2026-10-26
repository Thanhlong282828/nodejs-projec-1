// FormRequest của module: chỉ kiểm tra input, không truy vấn hoặc ghi DB.
import { z } from "zod";
import { str } from "../../../lib/validation-primitives.js";
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
