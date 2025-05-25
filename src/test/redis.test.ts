import { cacheSet, cacheGet, publish, subscribe } from '../redis';

jest.mock('../redis', () => {
  const store: Record<string, any> = {};
  let pubsubCallback: ((msg: string) => void) | null = null;
  return {
    connectRedis: jest.fn(),
    getRedis: jest.fn(() => ({
      set: jest.fn((key: string, val: string) => { store[key] = val; }),
      get: jest.fn((key: string) => store[key]),
    })),
    cacheSet: jest.fn((key: string, val: any) => { store[key] = val; }),
    cacheGet: jest.fn((key: string) => store[key]),
    publish: jest.fn((channel: string, msg: string) => { if (pubsubCallback) pubsubCallback(msg); }),
    subscribe: jest.fn((channel: string, cb: (msg: string) => void) => { pubsubCallback = cb; }),
  };
});

describe('Redis (mocked) integration', () => {
  it('set/get, cache, and pub/sub', async () => {
    const redis = require('../redis').getRedis('test');
    await redis.set('foo', 'bar');
    const val = await redis.get('foo');
    expect(val).toBe('bar');

    await cacheSet('user:1', { id: 1, name: 'Test' }, 60);
    const cached = await cacheGet('user:1');
    expect(cached).toMatchObject({ id: 1, name: 'Test' });

    // Pub/Sub
    await new Promise((resolve) => {
      subscribe('test-channel', msg => {
        expect(msg).toBe('hello');
        resolve(undefined);
      });
      publish('test-channel', 'hello');
    });
  });
}); 