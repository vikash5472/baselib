import { z } from 'zod';
import { AppError } from '../errors';

const v: typeof z & {
  validate: <T extends z.ZodRawShape>(schemaObject: T, data: unknown) => z.infer<z.ZodObject<T>>;
  isEmail: (input: string) => boolean; // Add isEmail to the type definition
} = Object.assign(z, {
  validate<T extends z.ZodRawShape>(schemaObject: T, data: unknown): z.infer<z.ZodObject<T>> {
    const schema = z.object(schemaObject);
    const result = schema.safeParse(data);
    if (!result.success) {
      throw new AppError('Validation failed', 400, 'VALIDATION', result.error.flatten());
    }
    return result.data;
  },
  isEmail(input: string): boolean {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input);
  },
});

export default v;
export { v };
