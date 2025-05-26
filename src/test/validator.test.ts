import { v, validate } from '../validator';
import { AppError } from '../errors';

describe('validator utility', () => {
  it('validates and returns typed data', () => {
    const input = { email: 'a@b.com', age: 22 };
    const result = v.validate({
      email: v.string().email(),
      age: v.number().int().min(18),
    }, input);
    expect(result).toEqual(input);
  });

  it('throws AppError on validation failure', () => {
    expect(() => v.validate({ email: v.string().email() }, { email: 'bad' }))
      .toThrow(AppError);
    try {
      v.validate({ email: v.string().email() }, { email: 'bad' });
    } catch (e) {
      const err = e as AppError;
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(400);
      expect(err.type).toBe('VALIDATION');
      expect(err.context).toBeDefined();
    }
  });

  it('validate() helper works with zod schema', () => {
    const schema = v.object({ id: v.string().uuid() });
    const input = { id: '123e4567-e89b-12d3-a456-426614174000' };
    expect(validate(schema, input)).toEqual(input);
  });

  it('validate() throws AppError for invalid zod schema', () => {
    const schema = v.object({ id: v.string().uuid() });
    expect(() => validate(schema, { id: 'bad' })).toThrow(AppError);
  });

  it('zod passthrough works', () => {
    const schema = v.object({ foo: v.string() });
    expect(schema.parse({ foo: 'bar' })).toEqual({ foo: 'bar' });
  });
}); 