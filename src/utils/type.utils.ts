export function isObject(input: unknown): boolean {
  return typeof input === 'object' && input !== null && !Array.isArray(input);
}

export function isEmpty(input: any): boolean {
  if (input == null) return true;
  if (typeof input === 'string' || Array.isArray(input)) return input.length === 0;
  if (isObject(input)) return Object.keys(input).length === 0;
  return false;
}

export function isEmail(input: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input);
} 