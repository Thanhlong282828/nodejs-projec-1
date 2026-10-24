import { readFile } from "node:fs/promises";
try {
  const items = JSON.parse(
    await readFile(
      process.argv[2] || new URL("./products.json", import.meta.url),
      "utf8",
    ),
  );
  if (
    !Array.isArray(items) ||
    items.some(
      (p) =>
        typeof p.name !== "string" ||
        !Number.isFinite(p.price) ||
        p.price < 0 ||
        !Number.isInteger(p.stock) ||
        p.stock < 0,
    )
  )
    throw new Error(
      "Expected products array with name, non-negative price/stock",
    );
  const highest = items.reduce(
    (best, p) => (!best || p.price > best.price ? p : best),
    null,
  );
  console.log(
    JSON.stringify(
      {
        "Total Products": items.length,
        "Total Stock": items.reduce((s, p) => s + p.stock, 0),
        "Inventory Value": items.reduce((s, p) => s + p.price * p.stock, 0),
        "Most Expensive Product": highest,
      },
      null,
      2,
    ),
  );
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
}
