import { config } from '../config/config.manager';

describe('config utility', () => {
  beforeAll(() => {
    process.env.TEST_REQUIRED = 'required';
    delete process.env.TEST_OPTIONAL;
    delete process.env.TEST_MISSING1;
    delete process.env.TEST_MISSING2;
  });

  it('gets a required variable', () => {
    expect(config.get('TEST_REQUIRED')).toBe('required');
  });

  it('throws if required variable is missing', () => {
    expect(() => config.get('DOES_NOT_EXIST')).toThrow();
  });

  it('gets an optional variable', () => {
    expect(config.getOptional('TEST_REQUIRED')).toBe('required');
    expect(config.getOptional('TEST_OPTIONAL')).toBeUndefined();
  });

  it('gets a variable or default', () => {
    expect(config.getOrDefault('TEST_REQUIRED', 'fallback')).toBe('required');
    expect(config.getOrDefault('TEST_OPTIONAL', 'fallback')).toBe('fallback');
  });

  it('validate throws if missing', () => {
    expect(() => config.validate(['TEST_REQUIRED', 'MISSING'])).toThrow();
  });

  it('validate passes if all present', () => {
    expect(() => config.validate(['TEST_REQUIRED'])).not.toThrow();
  });

  it('validate throws with multiple missing keys', () => {
    expect(() => config.validate(['TEST_MISSING1', 'TEST_MISSING2'])).toThrow(/TEST_MISSING1, TEST_MISSING2/);
  });

  it('validateWithSchema works with a zod-like schema', () => {
    const schema = {
      parse: (data: any) => {
        if (!data.TEST_REQUIRED) throw new Error('Invalid');
        return { TEST_REQUIRED: data.TEST_REQUIRED };
      },
    };
    expect(config.validateWithSchema(schema)).toEqual({ TEST_REQUIRED: 'required' });
  });

  it('validateWithSchema throws on invalid schema', () => {
    const schema = {
      parse: (data: any) => {
        if (!data.TEST_REQUIRED) throw new Error('Invalid');
        return { TEST_REQUIRED: data.TEST_REQUIRED };
      },
    };
    delete process.env.TEST_REQUIRED;
    expect(() => config.validateWithSchema(schema)).toThrow('Invalid');
    process.env.TEST_REQUIRED = 'required'; // restore
  });
}); 