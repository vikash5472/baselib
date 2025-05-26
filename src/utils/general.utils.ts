export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function retry<T>(fn: () => Promise<T>, times: number, delay = 0): Promise<T> {
  let lastErr;
  for (let i = 0; i < times; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (delay) await sleep(delay);
    }
  }
  throw lastErr;
}

export function uuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback (not cryptographically secure)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
} 