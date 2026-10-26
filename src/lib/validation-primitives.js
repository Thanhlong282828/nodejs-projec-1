import { z } from "zod";
export const str = (max = 120) => z.string().trim().min(1).max(max);
export const id = z.number().int().positive();
export const roles = ["admin", "hr", "employee"];
