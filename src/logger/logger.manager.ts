import pino, { Logger as PinoBaseLogger, LoggerOptions } from 'pino';
import { PinoLogger, LoggerContext } from './types';

let instance: PinoLogger | null = null;

function createLogger(context: LoggerContext = {}, parent?: PinoBaseLogger): PinoLogger {
  const isDev = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'prod';
  const options: LoggerOptions = {
    level: process.env.LOG_LEVEL || 'info',
    timestamp: pino.stdTimeFunctions.isoTime,
    ...(isDev
      ? { transport: { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } } }
      : {}),
    base: undefined, // don't include pid, hostname by default
  };
  const logger: PinoBaseLogger = parent ? parent.child(context) : pino(options).child(context);

  const api: PinoLogger = {
    info: (msg, meta) => logger.info(meta || {}, msg),
    error: (msg, meta) => logger.error(meta || {}, msg),
    warn: (msg, meta) => logger.warn(meta || {}, msg),
    debug: (msg, meta) => logger.debug(meta || {}, msg),
    child: (childContext: LoggerContext) => createLogger(childContext, logger),
    _pino: logger,
  };
  return api;
}

export function getLogger(): PinoLogger {
  if (!instance) {
    instance = createLogger();
  }
  return instance;
}

export const logger = getLogger(); 