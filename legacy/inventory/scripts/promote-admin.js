import { db } from "../src/lib/db.js";
const email = process.argv[2];
if (!email) {
  console.error("Usage: npm run admin -- email");
  process.exitCode = 1;
} else {
  const [r] = await db.execute("UPDATE users SET role='admin' WHERE email=?", [
    email,
  ]);
  console.log(`Updated ${r.affectedRows} user(s)`);
}
await db.end();
