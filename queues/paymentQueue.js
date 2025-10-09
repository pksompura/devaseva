import { Queue } from "bullmq";
import { redisConnection } from "../redis.js";

export const paymentQueue = new Queue("paymentQueue", {
  connection: redisConnection,
});
