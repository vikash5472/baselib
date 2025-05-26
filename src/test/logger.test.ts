jest.mock('pino', () => {
  const actual = jest.requireActual('pino');
  return Object.assign(() => mockLogger, actual, { default: () => mockLogger });
});

const mockLogger: any = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  child: jest.fn((): any => mockLogger),
};

import { logger } from '../logger';

describe('logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should expose info, error, warn, debug, and child methods', () => {
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.child).toBe('function');
  });

  it('should log info, error, warn, debug', () => {
    logger.info('info', { foo: 1 });
    logger.error('error', { bar: 2 });
    logger.warn('warn', { baz: 3 });
    logger.debug('debug', { qux: 4 });
    expect(mockLogger.info).toHaveBeenCalledWith({ foo: 1 }, 'info');
    expect(mockLogger.error).toHaveBeenCalledWith({ bar: 2 }, 'error');
    expect(mockLogger.warn).toHaveBeenCalledWith({ baz: 3 }, 'warn');
    expect(mockLogger.debug).toHaveBeenCalledWith({ qux: 4 }, 'debug');
  });

  it('should return a child logger with context', () => {
    const child = logger.child({ module: 'test', requestId: 'abc' });
    expect(typeof child.info).toBe('function');
    expect(typeof child.child).toBe('function');
    expect(mockLogger.child).toHaveBeenCalledWith({ module: 'test', requestId: 'abc' });
  });

  it('should not re-initialize the singleton', () => {
    const logger1 = require('../logger').logger;
    const logger2 = require('../logger').logger;
    expect(logger1).toBe(logger2);
  });

  it('should log with meta object', () => {
    // This test is illustrative; in real usage, spy on pino instance
    expect(() => logger.info('test message', { foo: 'bar' })).not.toThrow();
    expect(() => logger.error('error message', { err: true })).not.toThrow();
  });
}); 