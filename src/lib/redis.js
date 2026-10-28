import Redis from "ioredis";
import { config } from "../config.js";
export const redis = new Redis({
  ...config.redis,
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  connectTimeout: 1000,
  retryStrategy: () => null,
});
redis.on("error", () => {});
export async function connected() {
  if (redis.status === "wait" || redis.status === "end") await redis.connect();
  return redis;
}
// Cache có thể lỗi mà HRM vẫn đọc được MySQL. Prefix riêng tránh đụng ứng dụng Redis khác.
export async function cached(key, seconds, load) {
  try {
    await connected();
    const value = await redis.get(`hrm:${key}`);
    if (value) return { value: JSON.parse(value), cache: "HIT" };
  } catch {}
  const value = await load();
  try {
    await redis.set(`hrm:${key}`, JSON.stringify(value), "EX", seconds);
  } catch {}
  return { value, cache: "MISS" };
}
export async function invalidate() {
  try {
    await connected();
    let cursor = "0";
    do {
      const [next, keys] = await redis.scan(
        cursor,
        "MATCH",
        "hrm:dashboard*",
        "COUNT",
        100,
      );
      cursor = next;
      if (keys.length) await redis.del(...keys);
    } while (cursor !== "0");
  } catch {}
}
