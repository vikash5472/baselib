import type { Logger as PinoBaseLogger } from 'pino';

export interface LoggerContext {
  requestId?: string;
  module?: string;
  [key: string]: any;
}

export interface PinoLogger {
  info: (msg: string, meta?: object) => void;
  error: (msg: string, meta?: object) => void;
  warn: (msg: string, meta?: object) => void;
  debug: (msg: string, meta?: object) => void;
  child: (context: LoggerContext) => PinoLogger;
  setUser?: (user: { id: string; email?: string; [key: string]: any }) => void;
  // Optionally expose the raw pino instance
  _pino?: PinoBaseLogger;
} 