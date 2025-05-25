export interface ConfigManager {
  get(key: string): string;
  getOptional(key: string): string | undefined;
  getOrDefault(key: string, fallback: string): string;
  validate?(keys: string[]): void;
  validateWithSchema?<T>(schema: { parse(data: unknown): T }): T;
} 