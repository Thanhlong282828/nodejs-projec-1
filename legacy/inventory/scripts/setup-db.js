import mysql from "mysql2/promise";
import { readFile } from "node:fs/promises";
import { config } from "../src/config.js";
const connection = await mysql.createConnection({
  ...config.db,
  multipleStatements: true,
});
try {
  await connection.query(
    await readFile(new URL("../database/schema.sql", import.meta.url), "utf8"),
  );
  console.log("Schema ready (non-destructive)");
} finally {
  await connection.end();
}
