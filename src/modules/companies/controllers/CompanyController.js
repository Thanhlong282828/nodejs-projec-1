import { queryBus, commandBus } from "../../../core/MessageBus.js";
import { data } from "../../../lib/http.js";
import {
  GetCompanyListQuery,
  GetCompanyDetailQuery,
} from "../queries/CompanyQueries.js";
import {
  CreateCompanyCommand,
  UpdateCompanyCommand,
} from "../commands/CompanyCommands.js";
export const list = async (req, res) =>
  data(res, await queryBus.ask(new GetCompanyListQuery(req.user)));
export const get = async (req, res) =>
  data(
    res,
    await queryBus.ask(new GetCompanyDetailQuery(req.user, req.params.id)),
  );
export const create = async (req, res) =>
  data(
    res,
    await commandBus.dispatch(new CreateCompanyCommand(req.user, req.body)),
    201,
  );
export const update = async (req, res) =>
  data(
    res,
    await commandBus.dispatch(
      new UpdateCompanyCommand(req.user, req.params.id, req.body),
    ),
  );
export const index = async (req, res) =>
  res.render("companies", {
    title: "Công ty",
    active: "companies",
    companies: await queryBus.ask(new GetCompanyListQuery(req.user)),
  });
