import { Worker, Job } from "bullmq";
import redisClient from "../../db/redisConnection";
import { keys } from "../../store/redis.store";
import templateParser from "./template.parser";
import MailService from "../Mail/mail";
import log from "../../utils/logger";
import { parseTemplate } from "../../utils/html.template";
import { MailJobData, MailItem, CsvRow, CampaignStatus } from "../../types";

const MailHandler = async (job: Job<MailJobData>) => {
  const { from, subject, campaignId } = job.data;

  await updateCampaignStatus(campaignId, {
    status: "processing",
    updatedAt: new Date().toISOString(),
  });

  try {
    const htmlTemplate = await keys.get(`html:${campaignId}`);
    if (!htmlTemplate) {
      log.error(`Campaign ${campaignId}: HTML Template Missing`);
      await updateCampaignStatus(campaignId, {
        status: "failed",
        updatedAt: new Date().toISOString(),
      });
      throw new Error("Template Missing");
    }

    const csvFile = await keys.get(`csv:${campaignId}`);
    if (!csvFile) {
      log.error(`Campaign ${campaignId}: CSV File Missing`);
      await updateCampaignStatus(campaignId, {
        status: "failed",
        updatedAt: new Date().toISOString(),
      });
      throw new Error("CSV File Missing");
    }

    const csv: CsvRow[] = JSON.parse(csvFile);
    const totalEmails = csv.length;

    await updateCampaignStatus(campaignId, {
      totalEmails,
      updatedAt: new Date().toISOString(),
    });

    const mailList: MailItem[] = [];

    for (const row of csv) {
      try {
        const html = templateParser({
          htmlTemplate,
          rowData: row,
        });
        const parsedSubject = parseTemplate(subject, row);
        mailList.push({
          from,
          to: row.recipient,
          html,
          subject: parsedSubject,
        });
      } catch (error) {
        log.error(
          `Campaign ${campaignId}: Error processing template for recipient ${row.recipient}: ${(error as Error).message}`
        );
        continue;
      }
    }

    const mailer = new MailService();
    let sentEmails = 0;
    let failedEmails = 0;

    for (const mail of mailList) {
      try {
        await mailer.sendMail(mail.from, mail.to, mail.subject, mail.html);
        sentEmails++;

        const progress = Math.round((sentEmails / totalEmails) * 100);
        await job.updateProgress(progress);
        await updateCampaignStatus(campaignId, {
          sentEmails,
          updatedAt: new Date().toISOString(),
        });

        log.info(`Campaign ${campaignId}: Sent email to ${mail.to} (${sentEmails}/${totalEmails})`);
      } catch (err) {
        failedEmails++;
        log.error(
          `Campaign ${campaignId}: Failed to send mail to ${mail.to}: ${(err as Error).message}`
        );
      }
    }

    await updateCampaignStatus(campaignId, {
      status: "completed",
      sentEmails,
      failedEmails,
      updatedAt: new Date().toISOString(),
    });

    await keys.del(`html:${campaignId}`);
    await keys.del(`csv:${campaignId}`);

    log.info(`Campaign ${campaignId}: Completed. Sent: ${sentEmails}, Failed: ${failedEmails}`);
    
    return { sentEmails, failedEmails, totalEmails };
  } catch (error) {
    log.error(`Campaign ${campaignId}: Error - ${(error as Error).message}`);
    await updateCampaignStatus(campaignId, {
      status: "failed",
      updatedAt: new Date().toISOString(),
    });
    throw error;
  }
};

async function updateCampaignStatus(
  campaignId: string,
  updates: Partial<CampaignStatus>
) {
  const existing = await keys.get(`campaign:${campaignId}`);
  const current: Partial<CampaignStatus> = existing ? JSON.parse(existing) : {};
  const updated = { ...current, ...updates };
  await keys.set(`campaign:${campaignId}`, updated);
}

const mailWorker = new Worker<MailJobData>("mail-queue", MailHandler, {
  connection: redisClient,
  concurrency: 1,
});

mailWorker.on("completed", (job: Job<MailJobData>, result) => {
  log.info(
    `Mail Worker: Job ${job.id} for campaign ${job.data.campaignId} completed. Result: ${JSON.stringify(result)}`
  );
});

mailWorker.on("failed", (job, error) => {
  log.error(
    `Mail Worker: Job ${job?.id} failed: ${(error as Error).message}`
  );
});

mailWorker.on("progress", (job, progress) => {
  log.info(`Mail Worker: Job ${job.id} is ${progress}% complete`);
});

export default mailWorker;
