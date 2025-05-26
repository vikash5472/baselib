import sgMail from '@sendgrid/mail';
import { EmailProvider, EmailOptions, EmailResult } from '../types';

export interface SendGridProviderOptions {
  apiKey: string;
  from?: string;
}

export class SendGridProvider implements EmailProvider {
  private from?: string;

  constructor(private options: SendGridProviderOptions) {
    sgMail.setApiKey(options.apiKey);
    this.from = options.from;
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      const msg: any = {
        to: options.to,
        from: options.from || this.from,
        subject: options.subject,
        text: options.text,
        html: options.html,
        cc: options.cc,
        bcc: options.bcc,
        attachments: options.attachments,
      };
      const [response] = await sgMail.send(msg);
      const messageId = response.headers['x-message-id'] || response.headers['X-Message-Id'];
      return { success: true, messageId };
    } catch (error) {
      return { success: false, error };
    }
  }
} 