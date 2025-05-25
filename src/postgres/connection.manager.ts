// src/postgres/connection.manager.ts

import { Pool, PoolConfig } from 'pg';

// Class to manage multiple PostgreSQL connections
// Should handle connection pooling and retrieval
export class ConnectionManager {
  private static instance: ConnectionManager;
  private pools: Map<string, Pool> = new Map();

  private constructor() {}

  public static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager();
    }
    return ConnectionManager.instance;
  }

  public async connect(name: string, config: PoolConfig): Promise<Pool> {
    if (this.pools.has(name)) {
      console.warn(`Connection pool named '${name}' already exists. Returning existing pool.`);
      return this.pools.get(name)!;
    }

    const pool = new Pool(config);

    // Test connection
    try {
      await pool.query('SELECT 1');
      console.log(`Successfully connected to database '${name}'.`);
    } catch (error) {
      console.error(`Failed to connect to database '${name}':`, error);
      throw error;
    }

    this.pools.set(name, pool);
    return pool;
  }

  public getPool(name: string): Pool | undefined {
    return this.pools.get(name);
  }

  public async disconnect(name: string): Promise<void> {
    const pool = this.pools.get(name);
    if (pool) {
      await pool.end();
      this.pools.delete(name);
      console.log(`Disconnected from database '${name}'.`);
    } else {
      console.warn(`Connection pool named '${name}' not found.`);
    }
  }

  public async disconnectAll(): Promise<void> {
    const disconnectPromises = Array.from(this.pools.keys()).map(name => this.disconnect(name));
    await Promise.all(disconnectPromises);
    console.log('Disconnected from all database pools.');
  }
} 