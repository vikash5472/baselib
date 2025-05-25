import { connectPostgres, getDrizzleClient } from '../postgres';

jest.mock('../postgres', () => {
  let connected = false;
  return {
    connectPostgres: jest.fn(() => { connected = true; }),
    getDrizzleClient: jest.fn(() => ({
      execute: jest.fn(async (query: string) => {
        if (!connected) throw new Error('Not connected');
        if (query === 'SELECT 1 as one') return [{ one: 1 }];
        return [];
      }),
    })),
  };
});

describe('Postgres (mocked) integration', () => {
  it('connects and runs a simple query', async () => {
    const { connectPostgres, getDrizzleClient } = require('../postgres');
    connectPostgres('test', {});
    const db = getDrizzleClient('test');
    const result = await db.execute('SELECT 1 as one');
    expect(result[0].one).toBe(1);
  });
}); 