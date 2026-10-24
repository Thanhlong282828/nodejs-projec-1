import { readFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import { db } from "../src/lib/db.js";
try {
  const pending = delay(50, "done");
  console.log("Without await:", pending instanceof Promise);
  const results = await Promise.all([
    readFile(new URL("../day43/products.json", import.meta.url), "utf8"),
    db.execute("SELECT 1 AS value"),
    pending,
  ]);
  console.log(
    "File, DB, delay completed:",
    results.map((v) => typeof v),
  );
  try {
    await db.execute("SELECT * FROM intentionally_missing_week7_table");
  } catch (error) {
    console.log("Expected rejection caught:", error.code);
  }
  await Promise.reject(new Error("Fake failure")).catch((error) =>
    console.log("Promise.catch:", error.message),
  );
} finally {
  await db.end();
}
