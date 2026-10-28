import { companyWhere } from "../../../core/tenant.js";
// Query là yêu cầu đọc; Query Handler giao cho repository, không ghi dữ liệu.
import * as repository from "../repositories/DepartmentReadRepository.js";
export class GetDepartmentListQuery {
  constructor(actor, withEmployees = false) {
    this.actor = actor;
    this.withEmployees = withEmployees;
    Object.freeze(this);
  }
}
export const queryHandlers = [
  [
    GetDepartmentListQuery,
    ({ actor, withEmployees }) => repository.list(actor, withEmployees),
  ],
];
