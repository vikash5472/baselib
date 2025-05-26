import { Connection, Document, SchemaDefinition as SchemaDefinition$1, Model, FilterQuery, UpdateQuery } from 'mongoose';
import Redis, { RedisOptions } from 'ioredis';
export { RedisOptions } from 'ioredis';
import { QueueOptions, JobsOptions, Queue, Processor, WorkerOptions, Worker } from 'bullmq';
import * as drizzle_orm_node_postgres from 'drizzle-orm/node-postgres';
import { drizzle } from 'drizzle-orm/node-postgres';
import { PoolConfig } from 'pg';
import * as drizzle_orm from 'drizzle-orm';
import { Table, InferModel } from 'drizzle-orm';
export { InferModel, Table } from 'drizzle-orm';
import { Logger } from 'pino';
import { z } from 'zod';
export { ZodError, ZodIssue, ZodObject, ZodRawShape, ZodTypeAny } from 'zod';

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

declare function connectPostgres(name: string, config: PoolConfig): void;
declare function getDrizzleClient(name: string): ReturnType<typeof drizzle>;

declare function createRepository<T extends Table, PK extends keyof InferModel<T, 'select'> = 'id'>(table: T, dbName?: string, primaryKey?: PK): {
    db: drizzle_orm_node_postgres.NodePgDatabase<Record<string, unknown>> & {
        $client: drizzle_orm_node_postgres.NodePgClient;
    };
    insert: (data: { [Key in keyof T["_"]["columns"] & string as drizzle_orm.RequiredKeyOnly<Key, T["_"]["columns"][Key]>]: T["_"]["columns"][Key]["_"]["notNull"] extends true ? T["_"]["columns"][Key]["_"]["data"] : T["_"]["columns"][Key]["_"]["data"] | null; } & { [Key_1 in keyof T["_"]["columns"] & string as drizzle_orm.OptionalKeyOnly<Key_1, T["_"]["columns"][Key_1], unknown>]?: (T["_"]["columns"][Key_1]["_"]["notNull"] extends true ? T["_"]["columns"][Key_1]["_"]["data"] : T["_"]["columns"][Key_1]["_"]["data"] | null) | undefined; } extends infer T_1 ? { [K in keyof T_1]: ({ [Key in keyof T["_"]["columns"] & string as drizzle_orm.RequiredKeyOnly<Key, T["_"]["columns"][Key]>]: T["_"]["columns"][Key]["_"]["notNull"] extends true ? T["_"]["columns"][Key]["_"]["data"] : T["_"]["columns"][Key]["_"]["data"] | null; } & { [Key_1 in keyof T["_"]["columns"] & string as drizzle_orm.OptionalKeyOnly<Key_1, T["_"]["columns"][Key_1], unknown>]?: (T["_"]["columns"][Key_1]["_"]["notNull"] extends true ? T["_"]["columns"][Key_1]["_"]["data"] : T["_"]["columns"][Key_1]["_"]["data"] | null) | undefined; })[K]; } : never) => Promise<void>;
    findAll: () => Promise<({ [Key in keyof T["_"]["columns"] & string as Key]: T["_"]["columns"][Key]["_"]["notNull"] extends true ? T["_"]["columns"][Key]["_"]["data"] : T["_"]["columns"][Key]["_"]["data"] | null; } extends infer T_1 ? { [K in keyof T_1]: { [Key in keyof T["_"]["columns"] & string as Key]: T["_"]["columns"][Key]["_"]["notNull"] extends true ? T["_"]["columns"][Key]["_"]["data"] : T["_"]["columns"][Key]["_"]["data"] | null; }[K]; } : never)[]>;
    findById: (id: ({ [Key in keyof T["_"]["columns"] & string as Key]: T["_"]["columns"][Key]["_"]["notNull"] extends true ? T["_"]["columns"][Key]["_"]["data"] : T["_"]["columns"][Key]["_"]["data"] | null; } extends infer T_1 ? { [K in keyof T_1]: { [Key in keyof T["_"]["columns"] & string as Key]: T["_"]["columns"][Key]["_"]["notNull"] extends true ? T["_"]["columns"][Key]["_"]["data"] : T["_"]["columns"][Key]["_"]["data"] | null; }[K]; } : never)[PK]) => Promise<({ [Key in keyof T["_"]["columns"] & string as Key]: T["_"]["columns"][Key]["_"]["notNull"] extends true ? T["_"]["columns"][Key]["_"]["data"] : T["_"]["columns"][Key]["_"]["data"] | null; } extends infer T_2 ? { [K in keyof T_2]: { [Key in keyof T["_"]["columns"] & string as Key]: T["_"]["columns"][Key]["_"]["notNull"] extends true ? T["_"]["columns"][Key]["_"]["data"] : T["_"]["columns"][Key]["_"]["data"] | null; }[K]; } : never) | undefined>;
    delete: (id: ({ [Key in keyof T["_"]["columns"] & string as Key]: T["_"]["columns"][Key]["_"]["notNull"] extends true ? T["_"]["columns"][Key]["_"]["data"] : T["_"]["columns"][Key]["_"]["data"] | null; } extends infer T_1 ? { [K in keyof T_1]: { [Key in keyof T["_"]["columns"] & string as Key]: T["_"]["columns"][Key]["_"]["notNull"] extends true ? T["_"]["columns"][Key]["_"]["data"] : T["_"]["columns"][Key]["_"]["data"] | null; }[K]; } : never)[PK]) => Promise<void>;
};

interface PlaceholderType {
}
type PostgresConnectionConfig = {
    user: string;
    password: string;
    host: string;
    port: number;
    database: string;
};

type ZodSchema<T> = {
    parse(data: unknown): T;
};
declare const config: {
    /**
     * Get a required environment variable. Throws if missing.
     * @param key The environment variable key
     * @returns The value
     * @throws If the variable is missing
     */
    get(key: string): string;
    /**
     * Get an optional environment variable. Returns undefined if missing.
     * @param key The environment variable key
     * @returns The value or undefined
     */
    getOptional(key: string): string | undefined;
    /**
     * Get an environment variable or a fallback value if missing.
     * @param key The environment variable key
     * @param fallback The fallback value
     * @returns The value or fallback
     */
    getOrDefault(key: string, fallback: string): string;
    /**
     * Validate that all given keys are present. Throws if any are missing.
     * @param keys The required keys
     * @throws If any are missing
     */
    validate(keys: string[]): void;
    /**
     * Validate environment using a Zod schema. Throws if invalid.
     * @param schema The Zod schema
     * @returns The validated result
     * @throws If validation fails
     */
    validateWithSchema<T>(schema: ZodSchema<T>): T;
};

interface ConfigManager {
    get(key: string): string;
    getOptional(key: string): string | undefined;
    getOrDefault(key: string, fallback: string): string;
    validate?(keys: string[]): void;
    validateWithSchema?<T>(schema: {
        parse(data: unknown): T;
    }): T;
}

interface EmailOptions {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
    from?: string;
    cc?: string | string[];
    bcc?: string | string[];
    attachments?: Array<{
        filename: string;
        content: Buffer | string;
        contentType?: string;
    }>;
}
interface EmailResult {
    success: boolean;
    messageId?: string;
    error?: any;
}
interface EmailProvider {
    sendEmail(options: EmailOptions): Promise<EmailResult>;
}

interface SendGridProviderOptions {
    apiKey: string;
    from?: string;
}
declare class SendGridProvider implements EmailProvider {
    private options;
    private from?;
    constructor(options: SendGridProviderOptions);
    sendEmail(options: EmailOptions): Promise<EmailResult>;
}

interface SmtpProviderOptions {
    host: string;
    port: number;
    secure?: boolean;
    auth?: {
        user: string;
        pass: string;
    };
    from?: string;
}
declare class SmtpProvider implements EmailProvider {
    private transporter;
    private defaultFrom?;
    constructor(options: SmtpProviderOptions);
    sendEmail(options: EmailOptions): Promise<EmailResult>;
}

declare const email: {
    setProvider(p: EmailProvider): void;
    setSecondaryProvider(p: EmailProvider): void;
    setDefaultSendGrid(options: SendGridProviderOptions): void;
    setSecondarySmtp(options: SmtpProviderOptions): void;
    sendEmail(options: EmailOptions): Promise<EmailResult>;
};

interface LoggerContext {
    requestId?: string;
    module?: string;
    [key: string]: any;
}
interface PinoLogger {
    info: (msg: string, meta?: object) => void;
    error: (msg: string, meta?: object) => void;
    warn: (msg: string, meta?: object) => void;
    debug: (msg: string, meta?: object) => void;
    child: (context: LoggerContext) => PinoLogger;
    setUser?: (user: {
        id: string;
        email?: string;
        [key: string]: any;
    }) => void;
    _pino?: Logger;
}

declare const logger: PinoLogger;

type index$1_LoggerContext = LoggerContext;
type index$1_PinoLogger = PinoLogger;
declare const index$1_logger: typeof logger;
declare namespace index$1 {
  export { type index$1_LoggerContext as LoggerContext, type index$1_PinoLogger as PinoLogger, index$1_logger as logger };
}

declare class AppError extends Error {
    statusCode: number;
    type: string;
    context?: Record<string, any>;
    isOperational: boolean;
    constructor(message: string, statusCode?: number, type?: string, context?: Record<string, any>);
}

declare enum ErrorType {
    VALIDATION = "VALIDATION",
    AUTH = "AUTH",
    NOT_FOUND = "NOT_FOUND",
    INTERNAL = "INTERNAL"
}

interface HandleErrorOptions {
    logger?: PinoLogger;
    traceId?: string;
}
declare function handleError(error: unknown, options?: HandleErrorOptions): {
    statusCode: number;
    message: string;
    type: string;
    traceId?: string;
};

type index_AppError = AppError;
declare const index_AppError: typeof AppError;
type index_ErrorType = ErrorType;
declare const index_ErrorType: typeof ErrorType;
declare const index_handleError: typeof handleError;
declare namespace index {
  export { index_AppError as AppError, index_ErrorType as ErrorType, index_handleError as handleError };
}

declare const v: typeof z & {
    validate: <T extends z.ZodRawShape>(schemaObject: T, data: unknown) => z.infer<z.ZodObject<T>>;
};

declare function validate<T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T>;

export { type BaseDocument, type BaseJobData, BaseRepository, type ConfigManager, type EmailOptions, type EmailProvider, type EmailResult, type JobOptions, MongoManager, type MongooseModel, type PlaceholderType, type PostgresConnectionConfig, type QueueConfig, type SchemaDefinition, SendGridProvider, type SendGridProviderOptions, SmtpProvider, type SmtpProviderOptions, cacheDel, cacheGet, cacheSet, config, connectPostgres, connectRedis, createModel, createQueue, createRepository, createWorker, disconnectAllRedis, disconnectSpecificRedis, email, index as errors, getDrizzleClient, getQueue, getRedis, index$1 as logger, publish, subscribe, v, validate };
