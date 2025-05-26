import 'lodash';

declare module 'lodash' {
  interface LoDashStatic {
    sleep: (ms: number) => Promise<void>;
    uuid: () => string;
    retry: <T>(fn: () => Promise<T>, times: number, delay?: number) => Promise<T>;
  }
}
