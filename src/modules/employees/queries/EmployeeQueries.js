import { companyWhere } from "../../../core/tenant.js";
// Query là yêu cầu đọc; Query Handler giao cho repository, không ghi dữ liệu.
import * as repository from "../repositories/EmployeeReadRepository.js";
export class GetEmployeeListQuery {
  constructor(actor, filters = {}) {
    this.actor = actor;
    this.filters = filters;
    Object.freeze(this);
  }
}
export class GetEmployeeDetailQuery {
  constructor(actor, id) {
    this.actor = actor;
    this.id = id;
    Object.freeze(this);
  }
}
export const queryHandlers = [
  [
    GetEmployeeListQuery,
    ({ actor, filters }) => repository.list(actor, filters),
  ],
  [GetEmployeeDetailQuery, ({ actor, id }) => repository.get(actor, id)],
];
