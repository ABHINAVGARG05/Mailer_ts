export interface MailJobData {
  from: string;
  subject: string;
  campaignId: string;
}

export interface MailItem {
  from: string;
  to: string;
  subject: string;
  html: string;
}

export interface CsvRow {
  recipient: string;
  [key: string]: string;
}

export interface SendMailRequest {
  from: string;
  subject: string;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  campaignId?: string;
}

export interface MailResponse {
  success: boolean;
  message: string;
  jobId?: string;
}

export interface StatusResponse {
  success: boolean;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'not_found';
  message?: string;
  progress?: number;
  totalEmails?: number;
  sentEmails?: number;
}

export interface CampaignStatus {
  campaignId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalEmails: number;
  sentEmails: number;
  failedEmails: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
}
