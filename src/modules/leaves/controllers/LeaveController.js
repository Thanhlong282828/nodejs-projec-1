// Tương tự controller DJI dùng $queries->ask() / $commands->dispatch().
import { queryBus, commandBus } from "../../../core/MessageBus.js";
import { data } from "../../../lib/http.js";
import { GetLeaveListQuery } from "../queries/LeaveQueries.js";
import {
  CreateLeaveCommand,
  DecideLeaveCommand,
  DeleteLeaveCommand,
} from "../commands/LeaveCommands.js";
export const list = async (req, res) =>
  data(res, await queryBus.ask(new GetLeaveListQuery(req.user, req.query)));
export const create = async (req, res) =>
  data(
    res,
    await commandBus.dispatch(new CreateLeaveCommand(req.user, req.body)),
    201,
  );
export const decide = async (req, res) =>
  data(
    res,
    await commandBus.dispatch(
      new DecideLeaveCommand(req.user, req.params.id, req.body),
    ),
  );
export const remove = async (req, res) => {
  await commandBus.dispatch(new DeleteLeaveCommand(req.user, req.params.id));
  res.status(204).end();
};
