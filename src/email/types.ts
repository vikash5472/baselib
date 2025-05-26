// Email types and provider interface

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{ filename: string; content: Buffer | string; contentType?: string }>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: any;
}

export interface EmailProvider {
  sendEmail(options: EmailOptions): Promise<EmailResult>;
} 