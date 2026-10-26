// Query là yêu cầu đọc; Query Handler giao cho repository, không ghi dữ liệu.
import * as repository from "../repositories/AttendanceReadRepository.js";
export class GetAttendanceListQuery {
  constructor(actor, filters = {}) {
    this.actor = actor;
    this.filters = filters;
    Object.freeze(this);
  }
}
export const queryHandlers = [
  [
    GetAttendanceListQuery,
    ({ actor, filters }) => repository.list(actor, filters),
  ],
];
