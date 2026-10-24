import { Umzug, SequelizeStorage } from "umzug";
import { fileURLToPath } from "node:url";
import { db } from "./db.js";
export const migrator = new Umzug({
  migrations: {
    glob: fileURLToPath(
      new URL("../../database/migrations/*.js", import.meta.url),
    ),
  },
  context: db.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize: db, tableName: "hrm_migrations" }),
  logger: console,
});
