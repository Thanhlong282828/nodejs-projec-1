// Query là yêu cầu đọc; Query Handler giao cho repository, không ghi dữ liệu.
import * as repository from "../repositories/DepartmentReadRepository.js";
export class GetDepartmentListQuery {
  constructor(withEmployees = false) {
    this.withEmployees = withEmployees;
    Object.freeze(this);
  }
}
export const queryHandlers = [
  [
    GetDepartmentListQuery,
    ({ withEmployees }) => repository.list(withEmployees),
  ],
];
