import { Umzug, SequelizeStorage } from "umzug";
import { fileURLToPath } from "node:url";
import { db } from "./db.js";
export const migrator = new Umzug({
  migrations: {
    glob: fileURLToPath(new URL("../migrations/*.js", import.meta.url)),
  },
  context: db.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize: db }),
  logger: console,
});
if (process.argv[1] === new URL(import.meta.url).pathname) {
  try {
    await migrator.up();
  } finally {
    await db.close();
  }
}
