// Query là yêu cầu đọc; Query Handler giao cho repository, không ghi dữ liệu.
import * as repository from "../repositories/LeaveReadRepository.js";
export class GetLeaveListQuery {
  constructor(actor, filters = {}) {
    this.actor = actor;
    this.filters = filters;
    Object.freeze(this);
  }
}
export const queryHandlers = [
  [GetLeaveListQuery, ({ actor, filters }) => repository.list(actor, filters)],
];
