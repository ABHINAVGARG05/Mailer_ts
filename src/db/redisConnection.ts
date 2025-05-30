import Redis, { RedisOptions } from "ioredis";
import { env } from "../constants";
import logger from "../utils/logger";

const redisConfig: RedisOptions = {
  host: env.REDIS_HOST,
  port: Number(env.REDIS_PORT),
  password: env.REDIS_PASSWORD,
  username: "default",
  db: 0,
  maxRetriesPerRequest: null,
};

const redisClient = new Redis(redisConfig);

redisClient.on("ready", () => {
  logger.info("Redis connection established successfully");
});

redisClient.on("error", (err: Error) => {
  logger.error("Redis connection error:", err);
});

export default redisClient;
