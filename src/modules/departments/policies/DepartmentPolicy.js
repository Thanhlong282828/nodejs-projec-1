// Tương tự Policy DJI. Điều kiện ownership/trạng thái bản ghi vẫn kiểm tra khi xử lý Command.
import { managers, authenticated } from "../../../core/authorization.js";
export const DepartmentPolicy = {
  view: authenticated,
  create: managers,
  update: managers,
  delete: managers,
};
