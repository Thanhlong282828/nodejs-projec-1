import * as repo from "../repositories/CompanyReadRepository.js";
export class GetCompanyListQuery {
  constructor(actor) {
    this.actor = actor;
    Object.freeze(this);
  }
}
export class GetCompanyDetailQuery {
  constructor(actor, id) {
    Object.assign(this, { actor, id });
    Object.freeze(this);
  }
}
export const queryHandlers = [
  [GetCompanyListQuery, ({ actor }) => repo.list(actor)],
  [GetCompanyDetailQuery, ({ actor, id }) => repo.get(actor, id)],
];
