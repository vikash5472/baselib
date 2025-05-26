import { EmailProvider, EmailOptions, EmailResult } from './types';
import { SendGridProvider, SendGridProviderOptions } from './providers/sendgrid.provider';
import { SmtpProvider, SmtpProviderOptions } from './providers/smtp.provider';

let provider: EmailProvider | null = null;
let secondaryProvider: EmailProvider | null = null;

export const email = {
  setProvider(p: EmailProvider) {
    provider = p;
  },
  setSecondaryProvider(p: EmailProvider) {
    secondaryProvider = p;
  },
  setDefaultSendGrid(options: SendGridProviderOptions) {
    provider = new SendGridProvider(options);
  },
  setSecondarySmtp(options: SmtpProviderOptions) {
    secondaryProvider = new SmtpProvider(options);
  },
  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    if (!provider) {
      throw new Error('No email provider set. Call email.setProvider(...) or email.setDefaultSendGrid(...) first.');
    }
    try {
      return await provider.sendEmail(options);
    } catch (err) {
      if (secondaryProvider) {
        return secondaryProvider.sendEmail(options);
      }
      throw err;
    }
  },
}; 