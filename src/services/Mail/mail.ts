import nodemailer, { Transporter } from "nodemailer";
import { MailOptions } from "nodemailer/lib/json-transport";
import { env } from "../../constants";
import logger from "../../utils/logger";


const transporter: Transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: env.USER_EMAIL,
    pass: env.USER_PASSWORD,
  },
  pool: true,          
  maxConnections: 5,   
  maxMessages: 100,    
});

class MailService {
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

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return info;
  }
}

export default MailService;
