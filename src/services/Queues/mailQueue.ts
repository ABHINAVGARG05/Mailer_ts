import { Queue } from "bullmq";
import redisClient from "../../db/redisConnection";
import logger from "../../utils/logger";

const mailQueue = new Queue("mail-queue", { connection: redisClient });

mailQueue.on("waiting", (job) => {
  logger.info(`send-mail: JobId: ${job.id} is waiting to be processed`);
});

mailQueue.on("error", (error) => {
  logger.error(`send-mail: Error in mailQueue: ${(error as Error).message}`);
});

mailQueue.on("progress", (job, progress) => {
  logger.info(`send-mail: Job with id ${job.id} is ${progress}% complete.`);
});

const addToMailQueue = async (data: { from: string; subject: string }) => {
  await mailQueue.add("sendMail", data, {
    attempts: 3,
    removeOnComplete: true,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnFail: true,
  });
};

export {mailQueue, addToMailQueue}
