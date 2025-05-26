import { email } from '../email';

describe('email module', () => {
  const mockSendGrid = {
    sendEmail: jest.fn(async (opts) => ({ success: true, messageId: 'sg-123' })),
  };
  const mockSmtp = {
    sendEmail: jest.fn(async (opts) => ({ success: true, messageId: 'smtp-456' })),
  };

  beforeEach(() => {
    email.setProvider(mockSendGrid);
    email.setSecondaryProvider(undefined as any); // clear fallback
    jest.clearAllMocks();
  });

  it('sends email with default provider', async () => {
    const result = await email.sendEmail({ to: 'a@b.com', subject: 'S', text: 'T' });
    expect(result.success).toBe(true);
    expect(mockSendGrid.sendEmail).toHaveBeenCalled();
  });

  it('falls back to secondary provider on error', async () => {
    email.setProvider({
      sendEmail: jest.fn(async () => { throw new Error('fail'); }),
    });
    email.setSecondaryProvider(mockSmtp);
    const result = await email.sendEmail({ to: 'a@b.com', subject: 'S', text: 'T' });
    expect(result.success).toBe(true);
    expect(mockSmtp.sendEmail).toHaveBeenCalled();
  });

  it('throws if no provider is set', async () => {
    email.setProvider(undefined as any);
    await expect(email.sendEmail({ to: 'a@b.com', subject: 'S', text: 'T' })).rejects.toThrow();
  });
}); 