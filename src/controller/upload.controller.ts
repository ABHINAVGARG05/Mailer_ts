import { Request, Response, NextFunction } from "express";
import { parse } from "csv-parse/sync";
import { keys } from "../store/redis.store";
import { UploadResponse, CsvRow, CampaignStatus } from "../types";
import logger from "../utils/logger";
import crypto from "crypto";

const generateCampaignId = (): string => {
  return crypto.randomBytes(8).toString("hex");
};

export const uploadController = async (
  req: Request,
  res: Response<UploadResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const csvFile = files?.csv?.[0];
    const htmlFile = files?.html?.[0];

    // Validate files exist
    if (!csvFile) {
      res.status(400).json({
        success: false,
        message: "CSV file is required",
      });
      return;
    }

    if (!htmlFile) {
      res.status(400).json({
        success: false,
        message: "HTML template file is required",
      });
      return;
    }

    // Parse CSV file
    const csvContent = csvFile.buffer.toString("utf-8");
    let csvData: CsvRow[];

    try {
      csvData = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch (parseError) {
      res.status(400).json({
        success: false,
        message: `Invalid CSV format: ${(parseError as Error).message}`,
      });
      return;
    }

    if (csvData.length === 0) {
      res.status(400).json({
        success: false,
        message: "CSV file is empty",
      });
      return;
    }

    if (!csvData[0].recipient) {
      res.status(400).json({
        success: false,
        message: "CSV must have a 'recipient' column with email addresses",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = csvData.filter(
      (row) => !emailRegex.test(row.recipient)
    );

    if (invalidEmails.length > 0) {
      res.status(400).json({
        success: false,
        message: `Invalid email addresses found: ${invalidEmails
          .slice(0, 3)
          .map((r) => r.recipient)
          .join(", ")}${invalidEmails.length > 3 ? "..." : ""}`,
      });
      return;
    }

    const htmlContent = htmlFile.buffer.toString("utf-8");

    if (!htmlContent.trim()) {
      res.status(400).json({
        success: false,
        message: "HTML template file is empty",
      });
      return;
    }

    const campaignId = generateCampaignId();

    await keys.set(`csv:${campaignId}`, csvData);
    await keys.set(`html:${campaignId}`, htmlContent);

    const campaignStatus: CampaignStatus = {
      campaignId,
      status: "pending",
      totalEmails: csvData.length,
      sentEmails: 0,
      failedEmails: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await keys.set(`campaign:${campaignId}`, campaignStatus);

    logger.info(
      `Campaign ${campaignId}: Uploaded ${csvData.length} recipients`
    );

    res.status(201).json({
      success: true,
      message: `Campaign created with ${csvData.length} recipients`,
      campaignId,
    });
  } catch (error) {
    logger.error(`Upload error: ${(error as Error).message}`);
    next(error);
  }
};

export const getCampaignStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { campaignId } = req.params;

    if (!campaignId) {
      res.status(400).json({
        success: false,
        message: "Campaign ID is required",
      });
      return;
    }

    const campaignData = await keys.get(`campaign:${campaignId}`);

    if (!campaignData) {
      res.status(404).json({
        success: false,
        status: "not_found",
        message: "Campaign not found",
      });
      return;
    }

    const campaign: CampaignStatus = JSON.parse(campaignData);

    res.status(200).json({
      success: true,
      ...campaign,
      progress:
        campaign.totalEmails > 0
          ? Math.round((campaign.sentEmails / campaign.totalEmails) * 100)
          : 0,
    });
  } catch (error) {
    logger.error(`Get campaign status error: ${(error as Error).message}`);
    next(error);
  }
};

export const deleteCampaign = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { campaignId } = req.params;

    if (!campaignId) {
      res.status(400).json({
        success: false,
        message: "Campaign ID is required",
      });
      return;
    }

    // Delete all campaign data
    await keys.del(`csv:${campaignId}`);
    await keys.del(`html:${campaignId}`);
    await keys.del(`campaign:${campaignId}`);

    logger.info(`Campaign ${campaignId}: Deleted`);

    res.status(200).json({
      success: true,
      message: "Campaign deleted successfully",
    });
  } catch (error) {
    logger.error(`Delete campaign error: ${(error as Error).message}`);
    next(error);
  }
};
