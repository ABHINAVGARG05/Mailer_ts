import { Queue } from "bullmq";
import redisClient from "../../db/redisConnection";
import logger from "../../utils/logger";

const csvQueue = new Queue("csv-queue", { connection: redisClient });

csvQueue.on("waiting", (job) => {
  logger.info(`csv: JobId: ${job.id} is waiting to be processed`);
});

csvQueue.on("error", (error) => {
  logger.error(`csv: Error in csvQueue: ${(error as Error).message}`);
});

csvQueue.on("progress", (job, progress) => {
  logger.info(`csv: Job with id ${job.id} is ${progress}% complete.`);
});

const addToCSVQueue = async (data: { from: string; subject: string }) => {
  await csvQueue.add("csv-process", data, {
    attempts: 3,
    removeOnComplete: true,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnFail: true,
  });
};

export {csvQueue, addToCSVQueue}
