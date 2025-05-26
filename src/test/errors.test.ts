import { AppError, ErrorType, handleError } from '../errors';

describe('AppError', () => {
  it('should construct with message, status, type, and context', () => {
    const err = new AppError('fail', 400, ErrorType.VALIDATION, { foo: 1 });
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
    expect(err.message).toBe('fail');
    expect(err.statusCode).toBe(400);
    expect(err.type).toBe(ErrorType.VALIDATION);
    expect(err.context).toEqual({ foo: 1 });
    expect(err.isOperational).toBe(true);
  });

  it('should default status and type', () => {
    const err = new AppError('fail');
    expect(err.statusCode).toBe(500);
    expect(err.type).toBe(ErrorType.INTERNAL);
  });
});

describe('ErrorType', () => {
  it('should have expected values', () => {
    expect(ErrorType.VALIDATION).toBe('VALIDATION');
    expect(ErrorType.AUTH).toBe('AUTH');
    expect(ErrorType.NOT_FOUND).toBe('NOT_FOUND');
    expect(ErrorType.INTERNAL).toBe('INTERNAL');
  });
});

describe('handleError', () => {
  const logger = { error: jest.fn() } as any;

  it('should handle AppError and log', () => {
    const err = new AppError('fail', 401, ErrorType.AUTH, { user: 1 });
    const res = handleError(err, { logger, traceId: 'abc' });
    expect(res).toMatchObject({ statusCode: 401, message: 'fail', type: ErrorType.AUTH, traceId: 'abc' });
    expect(logger.error).toHaveBeenCalledWith('fail', expect.objectContaining({ type: ErrorType.AUTH, traceId: 'abc' }));
  });

  it('should handle native Error', () => {
    const err = new Error('native');
    const res = handleError(err);
    expect(res.statusCode).toBe(500);
    expect(res.type).toBe(ErrorType.INTERNAL);
    expect(res.message).toBe('native');
  });

  it('should handle unknown error', () => {
    const res = handleError('oops');
    expect(res.statusCode).toBe(500);
    expect(res.type).toBe(ErrorType.INTERNAL);
    expect(res.message).toBe('Unknown error');
  });
}); 