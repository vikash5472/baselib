import { ZodSchema, z } from 'zod';
import { AppError } from '../errors';

// Internal state
let dotenvLoaded = false;
let validatedConfig: Record<string, any> | null = null;

function loadDotenv() {
  if (!dotenvLoaded) {
    require('dotenv').config();
    dotenvLoaded = true;
  }
}

export const config = {
  /**
   * Loads and validates environment variables against a Zod schema.
   * This should be called once at application startup.
   * @param schema The Zod schema for environment variables.
   * @returns The validated config object.
   * @throws {AppError} If validation fails.
   */
  loadAndValidate<T extends ZodSchema<any>>(schema: T): z.infer<T> {
    loadDotenv();
    const result = schema.safeParse(process.env);
    if (!result.success) {
      throw new AppError(
        'Invalid environment configuration',
        500,
        'CONFIG_VALIDATION',
        result.error.flatten().fieldErrors
      );
    }
    validatedConfig = result.data;
    return result.data;
  },

  /**
   * Get a required environment variable. Throws if missing.
   * @param key The environment variable key.
   * @returns The value.
   * @throws {Error} If the variable is missing or config is not loaded.
   */
  get<K extends keyof T, T = any>(key: K): T[K] {
    if (!validatedConfig) {
      loadDotenv(); // Fallback for simple scripts, but validation is preferred
      const value = process.env[key as string];
      if (value === undefined) throw new Error(`Missing required environment variable: ${String(key)}`);
      return value as T[K];
    }
    return validatedConfig[key as string];
  },

  /**
   * Get an optional environment variable. Returns undefined if missing.
   * @param key The environment variable key.
   * @returns The value or undefined.
   */
  getOptional<K extends keyof T, T = any>(key: K): T[K] | undefined {
    if (!validatedConfig) {
      loadDotenv();
      return process.env[key as string] as T[K] | undefined;
    }
    return validatedConfig[key as string];
  },

  /**
   * Get an environment variable or a fallback value if missing.
   * @param key The environment variable key.
   * @param fallback The fallback value.
   * @returns The value or fallback.
   */
  getOrDefault<K extends keyof T, T = any>(key: K, fallback: T[K]): T[K] {
    const value = this.getOptional(key);
    return value ?? fallback;
  },

  /**
   * Resets the configuration state. Useful for testing.
   */
  _clear(): void {
    dotenvLoaded = false;
    validatedConfig = null;
    // Invalidate dotenv cache if possible, for testing different .env files
    delete require.cache[require.resolve('dotenv')];
  },
};
