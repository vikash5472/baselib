import { SendGridProvider } from '../email/providers/sendgrid.provider';
import sgMail from '@sendgrid/mail';
import { EmailOptions } from '../email/types';

// Mock the SendGrid Mail library
jest.mock('@sendgrid/mail', () => ({
    setApiKey: jest.fn(),
    send: jest.fn(),
}));

describe('SendGridProvider', () => {
    const mockApiKey = 'mock-sendgrid-api-key';
    const mockFromEmail = 'test@example.com';
    let provider: SendGridProvider;
    let mockSgMailSend: jest.Mock;

    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
        provider = new SendGridProvider({ apiKey: mockApiKey, from: mockFromEmail });
        mockSgMailSend = sgMail.send as jest.Mock;
    });

    it('should set the SendGrid API key on initialization', () => {
        expect(sgMail.setApiKey).toHaveBeenCalledTimes(1);
        expect(sgMail.setApiKey).toHaveBeenCalledWith(mockApiKey);
    });

    describe('sendEmail', () => {
        const emailOptions: EmailOptions = {
            to: 'recipient@example.com',
            subject: 'Test Subject',
            text: 'Test Text',
            html: '<h1>Test HTML</h1>',
        };

        it('should send an email successfully with default from address', async () => {
            mockSgMailSend.mockResolvedValueOnce([
                {
                    statusCode: 202,
                    headers: { 'x-message-id': 'mock-message-id-123' },
                },
            ]);

            const result = await provider.sendEmail(emailOptions);

            expect(mockSgMailSend).toHaveBeenCalledTimes(1);
            expect(mockSgMailSend).toHaveBeenCalledWith({
                to: emailOptions.to,
                from: mockFromEmail,
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

            mockSgMailSend.mockResolvedValueOnce([
                {
                    statusCode: 202,
                    headers: { 'x-message-id': 'mock-message-id-456' },
                },
            ]);

            const result = await provider.sendEmail(optionsWithCustomFrom);

            expect(mockSgMailSend).toHaveBeenCalledTimes(1);
            expect(mockSgMailSend).toHaveBeenCalledWith({
                to: optionsWithCustomFrom.to,
                from: customFromEmail, // Should use customFromEmail
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
            const mockError = new Error('SendGrid API error');
            mockSgMailSend.mockRejectedValueOnce(mockError);

            const result = await provider.sendEmail(emailOptions);

            expect(mockSgMailSend).toHaveBeenCalledTimes(1);
            expect(result).toEqual({ success: false, error: mockError });
        });

        it('should handle cc, bcc, and attachments', async () => {
            const optionsWithAllFields: EmailOptions = {
                ...emailOptions,
                cc: 'cc@example.com',
                bcc: 'bcc@example.com',
                attachments: [{ filename: 'test.txt', content: 'hello', contentType: 'text/plain' }],
            };

            mockSgMailSend.mockResolvedValueOnce([
                {
                    statusCode: 202,
                    headers: { 'x-message-id': 'mock-message-id-789' },
                },
            ]);

            const result = await provider.sendEmail(optionsWithAllFields);

            expect(mockSgMailSend).toHaveBeenCalledTimes(1);
            expect(mockSgMailSend).toHaveBeenCalledWith({
                to: optionsWithAllFields.to,
                from: mockFromEmail,
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
