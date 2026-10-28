import { overview } from "../repositories/AccessReadRepository.js";
export class GetAccessQuery {
  constructor(actor) {
    this.actor = actor;
    Object.freeze(this);
  }
}
export const queryHandlers = [[GetAccessQuery, ({ actor }) => overview(actor)]];
