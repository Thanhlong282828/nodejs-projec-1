import { readFile, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
try {
  await writeFile(
    new URL("../.env", import.meta.url),
    (
      await readFile(new URL("../.env.example", import.meta.url), "utf8")
    ).replace(
      "replace-with-at-least-32-random-characters",
      randomBytes(48).toString("hex"),
    ),
    { flag: "wx", mode: 0o600 },
  );
  console.log(".env created");
} catch (e) {
  if (e.code === "EEXIST") console.log(".env already exists; preserved");
  else throw e;
}
