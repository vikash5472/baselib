import { SmtpProvider } from '../email/providers/smtp.provider';
import nodemailer from 'nodemailer';
import { EmailOptions } from '../email/types';

// Mock nodemailer
jest.mock('nodemailer', () => ({
    createTransport: jest.fn().mockReturnValue({
        sendMail: jest.fn(),
    }),
}));

describe('SmtpProvider', () => {
    const mockSmtpOptions = {
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        auth: {
            user: 'testuser',
            pass: 'testpass',
        },
        from: 'default@example.com',
    };

    let provider: SmtpProvider;
    let mockSendMail: jest.Mock;
    let mockCreateTransport: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        mockCreateTransport = nodemailer.createTransport as jest.Mock;
        provider = new SmtpProvider(mockSmtpOptions);
        mockSendMail = mockCreateTransport.mock.results[0].value.sendMail;
    });

    it('should create a nodemailer transporter on initialization', () => {
        expect(nodemailer.createTransport).toHaveBeenCalledTimes(1);
        expect(nodemailer.createTransport).toHaveBeenCalledWith({
            host: mockSmtpOptions.host,
            port: mockSmtpOptions.port,
            secure: mockSmtpOptions.secure,
            auth: mockSmtpOptions.auth,
        });
    });

    describe('sendEmail', () => {
        const emailOptions: EmailOptions = {
            to: 'recipient@example.com',
            subject: 'Test Subject',
            text: 'Test Text',
            html: '<h1>Test HTML</h1>',
        };

        it('should send an email successfully with default from address', async () => {
            mockSendMail.mockResolvedValueOnce({ messageId: 'mock-message-id-123' });

            const result = await provider.sendEmail(emailOptions);

            expect(mockSendMail).toHaveBeenCalledTimes(1);
            expect(mockSendMail).toHaveBeenCalledWith({
                from: mockSmtpOptions.from,
                to: emailOptions.to,
                subject: emailOptions.subject,
                text: emailOptions.text,
                html: emailOptions.html,
                cc: undefined,
                bcc: undefined,
                attachments: undefined,
            });
            expect(result).toEqual({ success: true, messageId: 'mock-message-id-123' });
        });

        it('should send an email successfully with options.from overriding default from address', async () => {
            const customFromEmail = 'custom@example.com';
            const optionsWithCustomFrom = { ...emailOptions, from: customFromEmail };

            mockSendMail.mockResolvedValueOnce({ messageId: 'mock-message-id-456' });

            const result = await provider.sendEmail(optionsWithCustomFrom);

            expect(mockSendMail).toHaveBeenCalledTimes(1);
            expect(mockSendMail).toHaveBeenCalledWith({
                from: customFromEmail, // Should use customFromEmail
                to: optionsWithCustomFrom.to,
                subject: optionsWithCustomFrom.subject,
                text: optionsWithCustomFrom.text,
                html: optionsWithCustomFrom.html,
                cc: undefined,
                bcc: undefined,
                attachments: undefined,
            });
            expect(result).toEqual({ success: true, messageId: 'mock-message-id-456' });
        });

        it('should return success: false and error if sending fails', async () => {
            const mockError = new Error('SMTP send error');
            mockSendMail.mockRejectedValueOnce(mockError);

            const result = await provider.sendEmail(emailOptions);

            expect(mockSendMail).toHaveBeenCalledTimes(1);
            expect(result).toEqual({ success: false, error: mockError });
        });

        it('should handle cc, bcc, and attachments', async () => {
            const optionsWithAllFields: EmailOptions = {
                ...emailOptions,
                cc: 'cc@example.com',
                bcc: 'bcc@example.com',
                attachments: [{ filename: 'doc.pdf', content: 'base64encodedstring', contentType: 'application/pdf' }],
            };

            mockSendMail.mockResolvedValueOnce({ messageId: 'mock-message-id-789' });

            const result = await provider.sendEmail(optionsWithAllFields);

            expect(mockSendMail).toHaveBeenCalledTimes(1);
            expect(mockSendMail).toHaveBeenCalledWith({
                from: mockSmtpOptions.from,
                to: optionsWithAllFields.to,
                subject: optionsWithAllFields.subject,
                text: optionsWithAllFields.text,
                html: optionsWithAllFields.html,
                cc: optionsWithAllFields.cc,
                bcc: optionsWithAllFields.bcc,
                attachments: optionsWithAllFields.attachments,
            });
            expect(result).toEqual({ success: true, messageId: 'mock-message-id-789' });
        });
    });
});
