import nodemailer, { Transporter } from 'nodemailer';
import { EmailProvider, EmailOptions, EmailResult } from '../types';

export interface SmtpProviderOptions {
  host: string;
  port: number;
  secure?: boolean;
  auth?: { user: string; pass: string };
  from?: string;
}

export class SmtpProvider implements EmailProvider {
  private transporter: Transporter;
  private defaultFrom?: string;

  constructor(options: SmtpProviderOptions) {
    this.transporter = nodemailer.createTransport({
      host: options.host,
      port: options.port,
      secure: options.secure ?? false,
      auth: options.auth,
    });
    this.defaultFrom = options.from;
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      const info = await this.transporter.sendMail({
        from: options.from || this.defaultFrom,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        cc: options.cc,
        bcc: options.bcc,
        attachments: options.attachments,
      });
      return { success: true, messageId: info.messageId };
    } catch (error) {
      return { success: false, error };
    }
  }
} 