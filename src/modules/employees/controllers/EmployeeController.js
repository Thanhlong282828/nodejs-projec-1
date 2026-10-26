// Tương tự controller DJI dùng $queries->ask() / $commands->dispatch().
import { queryBus, commandBus } from "../../../core/MessageBus.js";
import { data } from "../../../lib/http.js";
import {
  GetEmployeeListQuery,
  GetEmployeeDetailQuery,
} from "../queries/EmployeeQueries.js";
import {
  CreateEmployeeCommand,
  UpdateEmployeeCommand,
  DeleteEmployeeCommand,
} from "../commands/EmployeeCommands.js";
export const list = async (req, res) =>
  data(res, await queryBus.ask(new GetEmployeeListQuery(req.query)));
export const get = async (req, res) =>
  data(res, await queryBus.ask(new GetEmployeeDetailQuery(req.params.id)));
export const create = async (req, res) =>
  data(
    res,
    await commandBus.dispatch(new CreateEmployeeCommand(req.user, req.body)),
    201,
  );
export const update = async (req, res) =>
  data(
    res,
    await commandBus.dispatch(
      new UpdateEmployeeCommand(req.user, req.params.id, req.body),
    ),
  );
export const remove = async (req, res) => {
  await commandBus.dispatch(new DeleteEmployeeCommand(req.user, req.params.id));
  res.status(204).end();
};
