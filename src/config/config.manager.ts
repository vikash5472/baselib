// Optional: If you use zod, import it in your project. Otherwise, this is a placeholder type.
type ZodSchema<T> = { parse(data: unknown): T };

let dotenvLoaded = false;

function ensureDotenvLoaded() {
  if (!dotenvLoaded) {
    // Dynamically require dotenv only on first use
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('dotenv').config();
    dotenvLoaded = true;
  }
}

export const config = {
  /**
   * Get a required environment variable. Throws if missing.
   * @param key The environment variable key
   * @returns The value
   * @throws If the variable is missing
   */
  get(key: string): string {
    ensureDotenvLoaded();
    const value = process.env[key];
    if (value === undefined) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
  },

  /**
   * Get an optional environment variable. Returns undefined if missing.
   * @param key The environment variable key
   * @returns The value or undefined
   */
  getOptional(key: string): string | undefined {
    ensureDotenvLoaded();
    return process.env[key];
  },

  /**
   * Get an environment variable or a fallback value if missing.
   * @param key The environment variable key
   * @param fallback The fallback value
   * @returns The value or fallback
   */
  getOrDefault(key: string, fallback: string): string {
    ensureDotenvLoaded();
    return process.env[key] ?? fallback;
  },

  /**
   * Validate that all given keys are present. Throws if any are missing.
   * @param keys The required keys
   * @throws If any are missing
   */
  validate(keys: string[]): void {
    ensureDotenvLoaded();
    const missing = keys.filter((k) => process.env[k] === undefined);
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  },

  /**
   * Validate environment using a Zod schema. Throws if invalid.
   * @param schema The Zod schema
   * @returns The validated result
   * @throws If validation fails
   */
  validateWithSchema<T>(schema: ZodSchema<T>): T {
    ensureDotenvLoaded();
    return schema.parse(process.env);
  },
}; 