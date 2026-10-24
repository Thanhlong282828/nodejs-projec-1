process.env.DB_PORT = "1";
const { app } = await import("../src/app.js");
const { db } = await import("../src/lib/db.js");
const server = app.listen(0, "127.0.0.1");
await new Promise((resolve) => server.once("listening", resolve));
try {
  const r = await fetch(`http://127.0.0.1:${server.address().port}/health`);
  if (r.status !== 503) throw new Error(`Expected 503 got ${r.status}`);
  console.log("DB offline: 503; API process still alive");
} finally {
  await new Promise((resolve) => server.close(resolve));
  await db.end();
}
