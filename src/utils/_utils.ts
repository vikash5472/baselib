import lodash from 'lodash';

// Optional: add custom helpers if needed
// Example: lodash.sleep = (ms: number) => new Promise(res => setTimeout(res, ms));
// Example: lodash.uuid = () => crypto.randomUUID?.() || 'fallback-id';

// You can extend lodash with custom methods here
// For example, if you want a sleep function:
Object.assign(lodash, {
  sleep: (ms: number) => new Promise(res => setTimeout(res, ms)),
  // Add a simple uuid generator, checking for crypto.randomUUID for browser/Node 14+ compatibility
  uuid: () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback for environments without crypto.randomUUID
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },
  // Add retry function
  retry: async <T>(fn: () => Promise<T>, times: number, delay = 0): Promise<T> => {
    let lastErr: any;
    for (let i = 0; i < times; i++) {
      try {
        return await fn();
      } catch (err) {
        lastErr = err;
        if (delay) await lodash.sleep(delay); // Use lodash.sleep
      }
    }
    throw lastErr;
  }
});


export const _ = lodash;
export default _;
