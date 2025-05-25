import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, PoolConfig } from 'pg';

const pools: Map<string, Pool> = new Map();
const drizzleClients: Map<string, ReturnType<typeof drizzle>> = new Map();

export function connectPostgres(name: string, config: PoolConfig): void {
  if (pools.has(name)) return;
  const pool = new Pool(config);
  pools.set(name, pool);
  const client = drizzle(pool);
  drizzleClients.set(name, client);
}

export function getDrizzleClient(name: string): ReturnType<typeof drizzle> {
  const client = drizzleClients.get(name);
  if (!client) throw new Error(`Drizzle client for '${name}' not found. Did you call connectPostgres?`);
  return client;
} 