import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { QueryBus, CommandBus } from "../src/core/MessageBus.js";
const root = new URL("../src/", import.meta.url);
async function files(url) {
  const result = [];
  for (const e of await readdir(url, { withFileTypes: true })) {
    const child = new URL(e.name + (e.isDirectory() ? "/" : ""), url);
    if (e.isDirectory()) result.push(...(await files(child)));
    else if (e.name.endsWith(".js")) result.push(child);
  }
  return result;
}
test("QueryBus and CommandBus have independent handlers and reject missing/duplicate wiring", async () => {
  class Query {
    constructor(value) {
      this.value = value;
      Object.freeze(this);
    }
  }
  class Command {
    constructor(value) {
      this.value = value;
      Object.freeze(this);
    }
  }
  const queries = new QueryBus(),
    commands = new CommandBus();
  queries.register(Query, (q) => q.value + 1);
  commands.register(Command, async (c) => c.value * 2);
  assert.equal(await queries.ask(new Query(2)), 3);
  assert.equal(await commands.dispatch(new Command(2)), 4);
  await assert.rejects(queries.ask(new Command(2)), /No handler/);
  assert.throws(() => queries.register(Query, () => 0), /Duplicate handler/);
  assert.ok(Object.isFrozen(new Query(2)));
});
test("Application and controllers do not query/write ORM models directly", async () => {
  const candidates = [
    new URL("app.js", root),
    ...(await files(new URL("modules/", root))).filter((f) =>
      f.pathname.includes("/controllers/"),
    ),
  ];
  for (const f of candidates) {
    const text = await readFile(f, "utf8");
    assert.doesNotMatch(
      text,
      /from\s+["'][^"']*(?:models\/|lib\/db\.js|sequelize)/,
      fileURLToPath(f),
    );
    assert.doesNotMatch(
      text,
      /\b(?:db|User|Employee|Department|Leave|Attendance|Audit|Outbox)\.(?:find|create|update|destroy|query|transaction|count|increment)/,
      fileURLToPath(f),
    );
  }
});
test("Queries and read repositories never mutate domain records", async () => {
  for (const f of (await files(new URL("modules/", root))).filter((f) =>
    /\/(queries|repositories)\//.test(f.pathname),
  )) {
    assert.doesNotMatch(
      await readFile(f, "utf8"),
      /\.(?:create|update|destroy|increment|decrement|bulkCreate|upsert|transaction)\s*\(/,
      fileURLToPath(f),
    );
  }
});
test("Each declared route policy action exists; no accidental deny-all after moving files", async () => {
  for (const f of (await files(new URL("modules/", root))).filter((f) =>
    f.pathname.includes("/routes/"),
  )) {
    const source = await readFile(f, "utf8");
    const policyImport =
      /import\s*\{\s*(\w+Policy)\s*\}\s*from\s*["']([^"']+)["']/.exec(source);
    if (!policyImport) continue;
    const policy = (await import(new URL(policyImport[2], f).href))[
      policyImport[1]
    ];
    for (const match of source.matchAll(
      /authorize\(\s*(\w+Policy),\s*["'](\w+)["']/g,
    ))
      assert.equal(
        typeof policy[match[2]],
        "function",
        fileURLToPath(f) + ": " + match[2],
      );
  }
});
test("Old flat services/controllers/routes are absent; one implementation per module", async () => {
  for (const module of [
    "employees",
    "departments",
    "leaves",
    "attendance",
    "auth",
    "dashboard",
  ])
    for (const name of ["service.js", "controller.js", "routes.js"])
      await assert.rejects(access(new URL(`modules/${module}/${name}`, root)));
});

test("Artisan-like route listing traverses nested routers without inventing resource routes", async () => {
  const { listRoutes } = await import("../src/core/route-list.js");
  const app = {
    router: {
      stack: [
        {
          handle: {
            stack: [
              {
                route: { path: "/api/employees/list", methods: { get: true } },
              },
              {
                route: {
                  path: "/api/employees/create",
                  methods: { post: true },
                },
              },
            ],
          },
        },
        { handle() {} },
      ],
    },
  };
  assert.deepEqual(listRoutes(app), [
    { method: "GET", url: "/api/employees/list" },
    { method: "POST", url: "/api/employees/create" },
  ]);
});
