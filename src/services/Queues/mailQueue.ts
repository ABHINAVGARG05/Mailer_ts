import { Queue, Job } from "bullmq";
import redisClient from "../../db/redisConnection";
import logger from "../../utils/logger";
import { MailJobData } from "../../types";

const mailQueue = new Queue<MailJobData>("mail-queue", { connection: redisClient });

mailQueue.on("waiting", (job: Job<MailJobData>) => {
  logger.info(`Mail Queue: Job ${job.id} (Campaign: ${job.data?.campaignId}) is waiting`);
});

mailQueue.on("error", (error) => {
  logger.error(`Mail Queue: Error - ${(error as Error).message}`);
});

mailQueue.on("progress", (job: Job<MailJobData>, progress) => {
  logger.info(`Mail Queue: Job ${job.id} is ${progress}% complete`);
});

const addToMailQueue = async (data: MailJobData): Promise<Job<MailJobData>> => {
  const job = await mailQueue.add("sendMail", data, {
    attempts: 3,
    removeOnComplete: {
      age: 3600,
      count: 100, 
    },
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnFail: {
      age: 86400,
    },
  });
  return job;
};

export { mailQueue, addToMailQueue };
