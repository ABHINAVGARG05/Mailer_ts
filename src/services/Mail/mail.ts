import nodemailer, { Transporter } from "nodemailer";
import { MailOptions } from "nodemailer/lib/json-transport";
import { env } from "../../constants";
import logger from "../../utils/logger";

class MailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: env.USER_EMAIL,
        pass: env.USER_PASSWORD,
      },
    });
  }

  public async sendMail(
    from: string,
    to: string,
    subject: string,
    htmlTemplate: string
  ) {
    const mailOptions: MailOptions = {
      from,
      to,
      subject,
      html: htmlTemplate,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      logger.info("Email sent:", info.messageId);
      return info;
    } catch (error) {
      logger.error("Failed to send email:", error);
      throw error;
    }
  }
}

export default MailService;
