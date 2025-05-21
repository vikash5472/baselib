import { Connection, Document, SchemaDefinition as SchemaDefinition$1, Model, FilterQuery, UpdateQuery } from 'mongoose';
import Redis, { RedisOptions } from 'ioredis';
export { RedisOptions } from 'ioredis';
import { QueueOptions, JobsOptions, Queue, Processor, WorkerOptions, Worker } from 'bullmq';

declare class MongoManager {
    private static instance;
    private connections;
    private constructor();
    static getInstance(): MongoManager;
    connect(connectionName: string, uri: string): Promise<Connection>;
    getConnection(connectionName: string): Connection;
    disconnect(connectionName?: string): Promise<void>;
}

type SchemaDefinition<T> = SchemaDefinition$1<T>;
interface BaseDocument extends Document {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
}
type MongooseModel<T extends BaseDocument> = Model<T>;

declare function createModel<T extends BaseDocument>(name: string, schemaDef: SchemaDefinition<T>, connectionName: string): MongooseModel<T>;

declare class BaseRepository<T extends BaseDocument> {
    protected model: MongooseModel<T>;
    constructor(model: MongooseModel<T>);
    findAll(filter?: FilterQuery<T>): Promise<T[]>;
    findById(id: string): Promise<T | null>;
    create(data: Partial<T>): Promise<T>;
    update(id: string, data: UpdateQuery<T>): Promise<T | null>;
    delete(id: string): Promise<T | null>;
}

declare const connectRedis: (name: string, options: RedisOptions) => Redis;
declare const getRedis: (name: string) => Redis;
declare const disconnectAllRedis: () => Promise<void>;
declare const disconnectSpecificRedis: (name: string) => Promise<void>;

/**
 * Stores object as JSON with TTL
 * @param key The key to store the value under.
 * @param value The value to store.
 * @param ttlSeconds The time-to-live for the key in seconds.
 * @param redisName Optional name of the Redis client to use. Defaults to 'default'.
 */
declare function cacheSet(key: string, value: unknown, ttlSeconds: number, redisName?: string): Promise<void>;
/**
 * Retrieves object and parses JSON
 * @param key The key to retrieve the value from.
 * @param redisName Optional name of the Redis client to use. Defaults to 'default'.
 * @returns The parsed object or null if not found.
 */
declare function cacheGet<T = any>(key: string, redisName?: string): Promise<T | null>;
/**
 * Deletes a cached key
 * @param key The key to delete.
 * @param redisName Optional name of the Redis client to use. Defaults to 'default'.
 * @returns The number of keys deleted.
 */
declare function cacheDel(key: string, redisName?: string): Promise<number>;

/**
 * Subscribe to a Redis channel
 * @param channel The channel to subscribe to.
 * @param onMessage Callback function to handle incoming messages.
 * @param redisName Optional name of the Redis client to use. Defaults to 'default'.
 */
declare function subscribe(channel: string, onMessage: (msg: string) => void, redisName?: string): void;
/**
 * Publish to a channel
 * @param channel The channel to publish the message to.
 * @param message The message to publish.
 * @param redisName Optional name of the Redis client to use. Defaults to 'default'.
 * @returns The number of clients that received the message.
 */
declare function publish(channel: string, message: string, redisName?: string): Promise<number>;

/**
 * Base interface for job data, allowing for extension.
 */
interface BaseJobData {
    [key: string]: any;
}
/**
 * Options for adding a job to a queue.
 * Extends BullMQ's JobOptions for full compatibility.
 */
interface JobOptions extends JobsOptions {
}
/**
 * Configuration options for a BullMQ queue.
 * Extends BullMQ's QueueOptions for full compatibility.
 */
interface QueueConfig extends QueueOptions {
}

/**
 * Creates and registers a new BullMQ queue or returns an existing one.
 * @param name The name of the queue.
 * @param redisName Optional name of the Redis client to use. Defaults to 'default'.
 * @param config Optional BullMQ queue configuration.
 * @returns The BullMQ Queue instance.
 */
declare function createQueue<T = any>(name: string, redisName?: string, config?: QueueConfig): Queue<T>;
/**
 * Retrieves an existing BullMQ queue by name.
 * @param name The name of the queue to retrieve.
 * @returns The BullMQ Queue instance, or throws an error if not found.
 */
declare function getQueue<T = any>(name: string): Queue<T>;

/**
 * Creates and registers a new BullMQ worker for a given queue.
 * @param queueName The name of the queue the worker will process.
 * @param processor The job processor function.
 * @param redisName Optional name of the Redis client to use. Defaults to 'default'.
 * @param opts Optional BullMQ worker options.
 * @returns The BullMQ Worker instance.
 */
declare function createWorker<T = any>(queueName: string, processor: Processor<T>, redisName?: string, opts?: WorkerOptions): Worker<T>;

export { type BaseDocument, type BaseJobData, BaseRepository, type JobOptions, MongoManager, type MongooseModel, type QueueConfig, type SchemaDefinition, cacheDel, cacheGet, cacheSet, connectRedis, createModel, createQueue, createWorker, disconnectAllRedis, disconnectSpecificRedis, getQueue, getRedis, publish, subscribe };
