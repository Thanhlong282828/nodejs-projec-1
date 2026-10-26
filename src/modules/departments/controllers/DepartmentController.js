// Tương tự controller DJI dùng $queries->ask() / $commands->dispatch().
import { queryBus, commandBus } from "../../../core/MessageBus.js";
import { data } from "../../../lib/http.js";
import { GetDepartmentListQuery } from "../queries/DepartmentQueries.js";
import {
  CreateDepartmentCommand,
  UpdateDepartmentCommand,
  DeleteDepartmentCommand,
} from "../commands/DepartmentCommands.js";
export const list = async (req, res) =>
  data(res, await queryBus.ask(new GetDepartmentListQuery()));
export const create = async (req, res) =>
  data(
    res,
    await commandBus.dispatch(new CreateDepartmentCommand(req.user, req.body)),
    201,
  );
export const update = async (req, res) =>
  data(
    res,
    await commandBus.dispatch(
      new UpdateDepartmentCommand(req.user, req.params.id, req.body),
    ),
  );
export const remove = async (req, res) => {
  await commandBus.dispatch(
    new DeleteDepartmentCommand(req.user, req.params.id),
  );
  res.status(204).end();
};
