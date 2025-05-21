import Redis, { RedisOptions } from 'ioredis';

class RedisManager {
  private static instance: RedisManager;
  private clients: Map<string, Redis>;

  private constructor() {
    this.clients = new Map<string, Redis>();
  }

  public static getInstance(): RedisManager {
    if (!RedisManager.instance) {
      RedisManager.instance = new RedisManager();
    }
    return RedisManager.instance;
  }

  public connectRedis(name: string, options: RedisOptions): Redis {
    if (this.clients.has(name)) {
      console.warn(`Redis client '${name}' already exists. Returning existing client.`);
      return this.clients.get(name)!;
    }

    const client = new Redis(options);

    client.on('connect', () => {
      console.log(`Redis client '${name}' connected successfully.`);
    });

    client.on('error', (err) => {
      console.error(`Redis client '${name}' connection error:`, err);
      // Depending on the application's needs, you might want to handle this more gracefully
      // e.g., attempt to reconnect, or just log the error.
    });

    client.on('end', () => {
      console.log(`Redis client '${name}' disconnected.`);
      this.clients.delete(name); // Remove disconnected client
    });

    this.clients.set(name, client);
    return client;
  }

  public getRedis(name: string): Redis {
    const client = this.clients.get(name);
    if (!client) {
      throw new Error(`Redis client '${name}' not found. Please connect first.`);
    }
    return client;
  }

  public async disconnectRedis(name?: string): Promise<void> {
    if (name) {
      const client = this.clients.get(name);
      if (client) {
        await client.quit();
        this.clients.delete(name);
        console.log(`Redis client '${name}' explicitly quit.`);
      } else {
        console.warn(`Redis client '${name}' not found for disconnection.`);
      }
    } else {
      // Disconnect all clients
      for (const [clientName, client] of this.clients.entries()) {
        await client.quit();
        console.log(`Redis client '${clientName}' explicitly quit.`);
      }
      this.clients.clear();
    }
  }
}

// Export functions for direct use, encapsulating the manager instance
const redisManager = RedisManager.getInstance();

export const connectRedis = (name: string, options: RedisOptions): Redis => {
  return redisManager.connectRedis(name, options);
};

export const getRedis = (name: string): Redis => {
  return redisManager.getRedis(name);
};

export const disconnectAllRedis = async (): Promise<void> => {
  await redisManager.disconnectRedis();
};

export const disconnectSpecificRedis = async (name: string): Promise<void> => {
  await redisManager.disconnectRedis(name);
};
