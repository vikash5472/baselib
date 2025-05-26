import { ErrorType } from './error.types';

export class AppError extends Error {
  statusCode: number;
  type: string;
  context?: Record<string, any>;
  isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    type: string = ErrorType.INTERNAL,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.type = type;
    this.context = context;
    this.isOperational = true;
    Error.captureStackTrace?.(this, this.constructor);
  }
} 