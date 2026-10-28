import { HttpError } from "../lib/http.js";
// Fail closed: scope phải từ tài khoản đã xác thực, không lấy companyId từ body/query.
export function companyWhere(actor) {
  if (!Number.isSafeInteger(actor?.companyId) || actor.companyId < 1)
    throw new HttpError(403, "Thiếu phạm vi công ty.");
  return { companyId: actor.companyId };
}
