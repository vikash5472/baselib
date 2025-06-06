import { AppError } from './app-error';
import { ErrorType } from './error.types';
import type { PinoLogger } from '../logger/types';

interface HandleErrorOptions {
  logger?: PinoLogger;
  traceId?: string;
}

export function handleError(
  error: unknown,
  options: HandleErrorOptions = {}
): {
  statusCode: number;
  message: string;
  type: string;
  traceId?: string;
} {
  let appError: AppError;
  if (error instanceof AppError) {
    appError = error;
  } else if (error instanceof Error) {
    appError = new AppError(error.message, 500, ErrorType.INTERNAL);
  } else {
    appError = new AppError('Unknown error', 500, ErrorType.INTERNAL);
  }

  if (options.logger) {
    options.logger.error(appError.message, {
      type: appError.type,
      statusCode: appError.statusCode,
      context: appError.context,
      stack: appError.stack,
      traceId: options.traceId,
    });
  }

  return {
    statusCode: appError.statusCode,
    message: appError.message,
    type: appError.type,
    traceId: options.traceId,
  };
} 