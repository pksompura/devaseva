// import { Redis } from "ioredis";

// export const redisConnection = new Redis({
//   host: process.env.REDIS_HOST || "127.0.0.1",
//   port: process.env.REDIS_PORT || 6379,
//   password: process.env.REDIS_PASSWORD || "", // Secure password from .env
//   maxRetriesPerRequest: null,
// });
// redis.js
// import { Redis } from "ioredis";

// export const redisConnection = new Redis(
//   process.env.REDIS_URL || "redis://127.0.0.1:6379",
//   {
//     maxRetriesPerRequest: null,
//   }
// );
import { Redis } from "ioredis";

export const redisConnection = new Redis("redis://127.0.0.1:6379", {
  maxRetriesPerRequest: null,
});
