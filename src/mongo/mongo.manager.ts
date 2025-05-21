import mongoose, { Connection } from 'mongoose';

class MongoManager {
  private static instance: MongoManager;
  private connections: Map<string, Connection>;

  private constructor() {
    this.connections = new Map<string, Connection>();
  }

  public static getInstance(): MongoManager {
    if (!MongoManager.instance) {
      MongoManager.instance = new MongoManager();
    }
    return MongoManager.instance;
  }

  public async connect(connectionName: string, uri: string): Promise<Connection> {
    if (this.connections.has(connectionName)) {
      console.warn(`Connection '${connectionName}' already exists. Returning existing connection.`);
      return this.connections.get(connectionName)!;
    }

    try {
      const connection = await mongoose.createConnection(uri).asPromise();
      this.connections.set(connectionName, connection);
      console.log(`MongoDB connection '${connectionName}' established successfully.`);

      connection.on('error', (err) => {
        console.error(`MongoDB connection '${connectionName}' error:`, err);
        // Depending on the application's needs, you might want to handle this more gracefully
        // e.g., attempt to reconnect, or just log the error without exiting.
      });

      connection.on('disconnected', () => {
        console.warn(`MongoDB connection '${connectionName}' disconnected.`);
        this.connections.delete(connectionName); // Remove disconnected connection
      });

      return connection;
    } catch (error) {
      console.error(`Failed to establish MongoDB connection '${connectionName}':`, error);
      throw error;
    }
  }

  public getConnection(connectionName: string): Connection {
    const connection = this.connections.get(connectionName);
    if (!connection) {
      throw new Error(`Connection '${connectionName}' not found. Please connect first.`);
    }
    return connection;
  }

  public async disconnect(connectionName?: string): Promise<void> {
    if (connectionName) {
      const connection = this.connections.get(connectionName);
      if (connection) {
        await connection.close();
        this.connections.delete(connectionName);
        console.log(`MongoDB connection '${connectionName}' disconnected.`);
      } else {
        console.warn(`Connection '${connectionName}' not found for disconnection.`);
      }
    } else {
      // Disconnect all connections
      for (const [name, connection] of this.connections.entries()) {
        await connection.close();
        console.log(`MongoDB connection '${name}' disconnected.`);
      }
      this.connections.clear();
    }
  }
}

export default MongoManager;
