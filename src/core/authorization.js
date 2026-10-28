import { HttpError } from "../lib/http.js";
// Tương tự Laravel Gate::authorize / middleware can:action. Policy không truy vấn DB.
export function authorize(policy, action) {
  return (req, res, next) => {
    if (typeof policy[action] !== "function" || !policy[action](req.user))
      throw new HttpError(403, "Bạn không có quyền thực hiện thao tác này.");
    next();
  };
}
