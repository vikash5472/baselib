import { config } from '../config/config.manager';
import { z } from 'zod';

describe('config utility', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules(); // Important to clear module cache for config singleton
    process.env = { ...originalEnv }; // Make a copy
    config._clear(); // Clear internal state of config manager
    process.env.TEST_REQUIRED = 'required';
    delete process.env.TEST_OPTIONAL;
    delete process.env.TEST_MISSING1;
    delete process.env.TEST_MISSING2;
  });

  afterAll(() => {
    process.env = originalEnv; // Restore original environment
  });

  it('gets a required variable', () => {
    // Before calling get, ensure config is initialized or get will try to load dotenv
    config.loadAndValidate(z.object({ TEST_REQUIRED: z.string() }));
    expect(config.get('TEST_REQUIRED')).toBe('required');
  });

  it('throws if required variable is missing after validation', () => {
    const schema = z.object({ DOES_NOT_EXIST: z.string() });
    expect(() => config.loadAndValidate(schema)).toThrow('Invalid environment configuration');
    // After loadAndValidate fails, get should also fail if trying to access missing var
    expect(() => config.get('DOES_NOT_EXIST')).toThrow('Missing required environment variable: DOES_NOT_EXIST');
  });

  it('gets an optional variable', () => {
    config.loadAndValidate(z.object({ TEST_REQUIRED: z.string(), TEST_OPTIONAL: z.string().optional() }));
    expect(config.getOptional('TEST_REQUIRED')).toBe('required');
    expect(config.getOptional('TEST_OPTIONAL')).toBeUndefined();
  });

  it('gets a variable or default', () => {
    config.loadAndValidate(z.object({ TEST_REQUIRED: z.string(), TEST_OPTIONAL: z.string().optional() }));
    expect(config.getOrDefault('TEST_REQUIRED', 'fallback')).toBe('required');
    expect(config.getOrDefault('TEST_OPTIONAL', 'fallback')).toBe('fallback');
  });

  describe('loadAndValidate', () => {
    it('should load and validate variables successfully', () => {
      const schema = z.object({
        TEST_REQUIRED: z.string(),
        ANOTHER_VAR: z.string().optional(),
      });
      process.env.ANOTHER_VAR = 'another';
      const validated = config.loadAndValidate(schema);
      expect(validated).toEqual({ TEST_REQUIRED: 'required', ANOTHER_VAR: 'another' });
      expect(config.get('TEST_REQUIRED')).toBe('required');
    });

    it('should throw AppError if validation fails', () => {
      const schema = z.object({
        MISSING_REQUIRED: z.string(),
      });
      expect(() => config.loadAndValidate(schema)).toThrow('Invalid environment configuration');
    });

    it('should not load .env again if already loaded', () => {
      // Mock dotenv to track calls
      const dotenv = require('dotenv');
      jest.spyOn(dotenv, 'config').mockReturnValue({});

      config._clear(); // Ensure fresh state
      process.env.MOCK_VAR = 'value';
      const schema = z.object({ MOCK_VAR: z.string() });
      config.loadAndValidate(schema);
      expect(dotenv.config).toHaveBeenCalledTimes(1);

      // Call again, should not call dotenv.config
      config.loadAndValidate(schema);
      expect(dotenv.config).toHaveBeenCalledTimes(1); // Still 1

      dotenv.config.mockRestore();
    });
  });

  describe('_clear', () => {
    it('should reset the internal state', () => {
      process.env.TEST_REQUIRED = 'initial_value'; // Set it for this specific test
      config.loadAndValidate(z.object({ TEST_REQUIRED: z.string() }));
      expect(config.get('TEST_REQUIRED')).toBe('initial_value');
      config._clear();
      delete process.env.TEST_REQUIRED; // Explicitly delete from process.env for this test
      // After clearing, it should throw because validatedConfig is null and process.env.TEST_REQUIRED is deleted
      expect(() => config.get('TEST_REQUIRED')).toThrow('Missing required environment variable: TEST_REQUIRED');
    });
  });
});
