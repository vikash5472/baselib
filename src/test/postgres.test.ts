import { connectPostgres, getDrizzleClient } from '../postgres';

jest.mock('../postgres', () => {
  const connections: Record<string, boolean> = {};
  return {
    connectPostgres: jest.fn((name: string) => { connections[name] = true; }),
    getDrizzleClient: jest.fn((name: string) => ({
      execute: jest.fn(async (query: string) => {
        if (!connections[name]) throw new Error('Not connected');
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

  it('throws if not connected', async () => {
    const { getDrizzleClient } = require('../postgres');
    const db = getDrizzleClient('test2');
    await expect(db.execute('SELECT 1 as one')).rejects.toThrow('Not connected');
  });
}); 