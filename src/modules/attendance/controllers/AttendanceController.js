// Tương tự controller DJI dùng $queries->ask() / $commands->dispatch().
import { queryBus, commandBus } from "../../../core/MessageBus.js";
import { data } from "../../../lib/http.js";
import { GetAttendanceListQuery } from "../queries/AttendanceQueries.js";
import {
  CheckInCommand,
  CheckOutCommand,
} from "../commands/AttendanceCommands.js";
export const list = async (req, res) =>
  data(
    res,
    await queryBus.ask(new GetAttendanceListQuery(req.user, req.query)),
  );
export const checkIn = async (req, res) =>
  data(res, await commandBus.dispatch(new CheckInCommand(req.user)), 201);
export const checkOut = async (req, res) =>
  data(res, await commandBus.dispatch(new CheckOutCommand(req.user)));
