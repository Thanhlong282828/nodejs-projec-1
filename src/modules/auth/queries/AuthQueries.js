import { safeUser } from "../../../models/index.js";
export class GetProfileQuery {
  constructor(actor) {
    this.actor = actor;
    Object.freeze(this);
  }
}
export const queryHandlers = [
  [GetProfileQuery, ({ actor }) => safeUser(actor)],
];
