import { queryBus, commandBus } from "../../../core/MessageBus.js";
import { data } from "../../../lib/http.js";
import { GetAccessQuery } from "../queries/AccessQueries.js";
import {
  CreateRoleCommand,
  UpdateRoleCommand,
  AssignAccessCommand,
} from "../commands/AccessCommands.js";
export const list = async (req, res) =>
  data(res, await queryBus.ask(new GetAccessQuery(req.user)));
export const index = async (req, res) =>
  res.render("access", {
    title: "Chức vụ & phân quyền",
    active: "access",
    result: await queryBus.ask(new GetAccessQuery(req.user)),
  });
export const create = async (req, res) =>
  data(
    res,
    await commandBus.dispatch(new CreateRoleCommand(req.user, req.body)),
    201,
  );
export const update = async (req, res) =>
  data(
    res,
    await commandBus.dispatch(
      new UpdateRoleCommand(req.user, req.params.id, req.body),
    ),
  );
export const assign = async (req, res) =>
  data(
    res,
    await commandBus.dispatch(
      new AssignAccessCommand(req.user, req.params.id, req.body),
    ),
  );
