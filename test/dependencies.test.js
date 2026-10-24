import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const run = promisify(execFile);
// Fault injection bằng biến môi trường của process test riêng; không tắt DB/Redis đang dùng.
test("Redis unavailable: cache falls back to actual database loader", async () => {
  const code = `import assert from 'node:assert/strict';import {cached,redis} from './src/lib/redis.js';let loads=0;const result=await cached('offline-test',30,async()=>{loads++;return {real:true};});assert.deepEqual(result,{value:{real:true},cache:'MISS'});assert.equal(loads,1);redis.disconnect();console.log('cache-fallback-ok');`;
  const result = await run(
    process.execPath,
    ["--env-file=.env", "--input-type=module", "-e", code],
    { env: { ...process.env, REDIS_PORT: "1" }, timeout: 10000 },
  );
  assert.match(result.stdout, /cache-fallback-ok/);
});
test("MySQL unavailable: HTTP health returns 503, process does not crash", async () => {
  const code = `import assert from 'node:assert/strict';import request from 'supertest';import {app} from './src/app.js';import {db} from './src/lib/db.js';const response=await request(app).get('/health');assert.equal(response.status,503);assert.match(response.body.error,/MySQL/);await db.close();console.log('db-offline-ok');`;
  const result = await run(
    process.execPath,
    ["--env-file=.env", "--input-type=module", "-e", code],
    { env: { ...process.env, DB_PORT: "1" }, timeout: 15000 },
  );
  assert.match(result.stdout, /db-offline-ok/);
});
