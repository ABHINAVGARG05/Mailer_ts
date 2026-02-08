import { Request, Response, NextFunction } from "express";
import { keys } from "../store/redis.store";
import { addToMailQueue } from "../services/Queues/mailQueue";
import { MailResponse, SendMailRequest, CampaignStatus } from "../types";
import logger from "../utils/logger";

export const sendMailController = async (
  req: Request<{}, MailResponse, SendMailRequest & { campaignId: string }>,
  res: Response<MailResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const { from, subject, campaignId } = req.body;

    if (!campaignId) {
      res.status(400).json({
        success: false,
        message: "Campaign ID is required. Upload files first using /api/upload",
      });
      return;
    }

    if (!from) {
      res.status(400).json({
        success: false,
        message: "Sender email (from) is required",
      });
      return;
    }

    if (!subject) {
      res.status(400).json({
        success: false,
        message: "Email subject is required",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(from)) {
      res.status(400).json({
        success: false,
        message: "Invalid sender email format",
      });
      return;
    }

    const campaignData = await keys.get(`campaign:${campaignId}`);
    if (!campaignData) {
      res.status(404).json({
        success: false,
        message: "Campaign not found. Please upload files first.",
      });
      return;
    }

    const campaign: CampaignStatus = JSON.parse(campaignData);

    if (campaign.status === "processing") {
      res.status(400).json({
        success: false,
        message: "Campaign is already being processed",
      });
      return;
    }

    if (campaign.status === "completed") {
      res.status(400).json({
        success: false,
        message: "Campaign has already been completed",
      });
      return;
    }

    const htmlExists = await keys.get(`html:${campaignId}`);
    const csvExists = await keys.get(`csv:${campaignId}`);

    if (!htmlExists || !csvExists) {
      res.status(400).json({
        success: false,
        message: "Campaign files not found. Please upload files again.",
      });
      return;
    }

    const job = await addToMailQueue({
      from,
      subject,
      campaignId,
    });

    logger.info(`Campaign ${campaignId}: Mail job added to queue`);

    res.status(202).json({
      success: true,
      message: `Email campaign started for ${campaign.totalEmails} recipients`,
      jobId: job?.id,
    });
  } catch (error) {
    logger.error(`Send mail error: ${(error as Error).message}`);
    next(error);
  }
};

export const previewMailController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { campaignId } = req.body;

    if (!campaignId) {
      res.status(400).json({
        success: false,
        message: "Campaign ID is required",
      });
      return;
    }

    const htmlTemplate = await keys.get(`html:${campaignId}`);
    const csvData = await keys.get(`csv:${campaignId}`);

    if (!htmlTemplate || !csvData) {
      res.status(404).json({
        success: false,
        message: "Campaign files not found",
      });
      return;
    }

    const csv = JSON.parse(csvData);
    const sampleRow = csv[0];

    let previewHtml = htmlTemplate;
    for (const [key, value] of Object.entries(sampleRow)) {
      previewHtml = previewHtml.replace(
        new RegExp(`{{${key}}}`, "g"),
        value as string
      );
    }

    res.status(200).json({
      success: true,
      preview: previewHtml,
      sampleData: sampleRow,
      totalRecipients: csv.length,
    });
  } catch (error) {
    logger.error(`Preview mail error: ${(error as Error).message}`);
    next(error);
  }
};
