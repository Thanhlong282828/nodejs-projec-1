// Query là yêu cầu đọc; Query Handler giao cho repository, không ghi dữ liệu.
import * as repository from "../repositories/EmployeeReadRepository.js";
export class GetEmployeeListQuery {
  constructor(filters = {}) {
    this.filters = filters;
    Object.freeze(this);
  }
}
export class GetEmployeeDetailQuery {
  constructor(id) {
    this.id = id;
    Object.freeze(this);
  }
}
export const queryHandlers = [
  [GetEmployeeListQuery, ({ filters }) => repository.list(filters)],
  [GetEmployeeDetailQuery, ({ id }) => repository.get(id)],
];
