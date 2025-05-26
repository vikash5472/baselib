import { z } from 'zod';
import { AppError } from '../errors';

export function validate<T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new AppError('Validation failed', 400, 'VALIDATION', result.error.flatten());
  }
  return result.data;
} 