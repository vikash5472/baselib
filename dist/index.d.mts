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
import { ZodSchema, z } from 'zod';
export { ZodError, ZodIssue, ZodObject, ZodRawShape, ZodTypeAny } from 'zod';
import { Logger } from 'pino';
import * as lodash from 'lodash';
import lodash__default from 'lodash';
import { Request, Response, NextFunction } from 'express';
import { JwtPayload, SignOptions, VerifyOptions } from 'jsonwebtoken';
import { Readable } from 'stream';

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

declare const config: {
    /**
     * Loads and validates environment variables against a Zod schema.
     * This should be called once at application startup.
     * @param schema The Zod schema for environment variables.
     * @returns The validated config object.
     * @throws {AppError} If validation fails.
     */
    loadAndValidate<T extends ZodSchema<any>>(schema: T): z.infer<T>;
    /**
     * Get a required environment variable. Throws if missing.
     * @param key The environment variable key.
     * @returns The value.
     * @throws {Error} If the variable is missing or config is not loaded.
     */
    get<K extends keyof T, T = any>(key: K): T[K];
    /**
     * Get an optional environment variable. Returns undefined if missing.
     * @param key The environment variable key.
     * @returns The value or undefined.
     */
    getOptional<K extends keyof T, T = any>(key: K): T[K] | undefined;
    /**
     * Get an environment variable or a fallback value if missing.
     * @param key The environment variable key.
     * @param fallback The fallback value.
     * @returns The value or fallback.
     */
    getOrDefault<K extends keyof T, T = any>(key: K, fallback: T[K]): T[K];
    /**
     * Resets the configuration state. Useful for testing.
     */
    _clear(): void;
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

interface ErrorReporter {
    report(error: AppError): void;
}

interface HandleErrorOptions {
    logger?: PinoLogger;
    traceId?: string;
    errorReporter?: ErrorReporter;
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
    isEmail: (input: string) => boolean;
};

declare function validate<T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T>;

type TimeZone = 'UTC' | 'IST' | string;
/**
 * A utility class for date and time operations with persistent timezone context.
 * Defaults to the system's local timezone if not explicitly set.
 */
declare class DateUtil {
    private static timezone;
    /**
     * Instantiates DateUtil. If a timezone is provided, it sets it as the static default.
     * @param tz Optional timezone string (e.g., 'UTC', 'IST', 'America/New_York').
     */
    constructor(tz?: TimeZone);
    /**
     * Sets the global default timezone for all DateUtil instances.
     * @param tz The timezone string (e.g., 'UTC', 'IST', 'America/New_York').
     */
    static setTimezone(tz: TimeZone): void;
    /**
     * Gets the currently configured global timezone.
     * @returns The current timezone string.
     */
    getTimezone(): string;
    /**
     * Returns the current date and time in the configured timezone.
     * @returns A Date object representing the current time in the configured timezone.
     */
    now(): Date;
    /**
     * Formats a date into a string in the configured timezone.
     * @param date The date to format.
     * @param pattern The format string (e.g., 'yyyy-MM-dd HH:mm:ss'). Defaults to 'yyyy-MM-dd HH:mm:ss'.
     * @returns The formatted date string.
     */
    format(date: Date, pattern?: string): string;
    /**
     * Converts a date to a Date object representing the same instant in the configured timezone.
     * This is useful for ensuring date operations are performed relative to a specific timezone.
     * @param date The date to convert.
     * @returns A new Date object representing the same instant but interpreted in the target timezone.
     */
    convertToTimeZone(date: Date): Date;
    /**
     * Adds a specified number of days to a date.
     * @param date The base date.
     * @param days The number of days to add.
     * @returns A new Date object.
     */
    addDays(date: Date, days: number): Date;
    /**
     * Subtracts a specified number of days from a date.
     * @param date The base date.
     * @param days The number of days to subtract.
     * @returns A new Date object.
     */
    subDays(date: Date, days: number): Date;
    /**
     * Adds a specified number of hours to a date.
     * @param date The base date.
     * @param hours The number of hours to add.
     * @returns A new Date object.
     */
    addHours(date: Date, hours: number): Date;
    /**
     * Subtracts a specified number of hours from a date.
     * @param date The base date.
     * @param hours The number of hours to subtract.
     * @returns A new Date object.
     */
    subHours(date: Date, hours: number): Date;
    /**
     * Adds a specified number of minutes to a date.
     * @param date The base date.
     * @param minutes The number of minutes to add.
     * @returns A new Date object.
     */
    addMinutes(date: Date, minutes: number): Date;
    /**
     * Subtracts a specified number of minutes from a date.
     * @param date The base date.
     * @param minutes The number of minutes to subtract.
     * @returns A new Date object.
     */
    subMinutes(date: Date, minutes: number): Date;
    /**
     * Checks if a date is in the future relative to the current time in the configured timezone.
     * @param date The date to check.
     * @returns True if the date is in the future, false otherwise.
     */
    isFuture(date: Date): boolean;
    /**
     * Checks if a date is in the past relative to the current time in the configured timezone.
     * @param date The date to check.
     * @returns True if the date is in the past, false otherwise.
     */
    isPast(date: Date): boolean;
    /**
     * Checks if a date is today in the configured timezone.
     * @param date The date to check.
     * @returns True if the date is today, false otherwise.
     */
    isToday(date: Date): boolean;
    /**
     * Checks if two dates are on the same day in the configured timezone.
     * @param a The first date.
     * @param b The second date.
     * @returns True if the dates are on the same day, false otherwise.
     */
    isSameDay(a: Date, b: Date): boolean;
    /**
     * Returns a new Date object representing the start of the day for the given date in the configured timezone.
     * @param date The date.
     * @returns A new Date object set to the start of the day.
     */
    startOfDay(date: Date): Date;
    /**
     * Returns a new Date object representing the end of the day for the given date in the configured timezone.
     * @param date The date.
     * @returns A new Date object set to the end of the day.
     */
    endOfDay(date: Date): Date;
    /**
     * Compares two dates.
     * @param a The first date.
     * @param b The second date.
     * @returns A number indicating the comparison result (negative if a < b, positive if a > b, 0 if equal).
     */
    compareDates(a: Date, b: Date): number;
    /**
     * Calculates the number of full days between two dates.
     * @param a The first date.
     * @param b The second date.
     * @returns The number of full days between the dates.
     */
    daysBetween(a: Date, b: Date): number;
    /**
     * Converts a date to a Unix timestamp (seconds since epoch).
     * @param date The date to convert.
     * @returns The Unix timestamp.
     */
    toUnix(date: Date): number;
    /**
     * Converts a Unix timestamp (seconds since epoch) to a Date object.
     * @param unix The Unix timestamp.
     * @returns A new Date object.
     */
    fromUnix(unix: number): Date;
    /**
     * Checks if the year of a given date is a leap year.
     * @param date The date to check.
     * @returns True if the year is a leap year, false otherwise.
     */
    isLeapYear(date: Date): boolean;
    /**
     * Checks if two dates are in the same hour in the configured timezone.
     * @param a The first date.
     * @param b The second date.
     * @returns True if the dates are in the same hour, false otherwise.
     */
    isSameHour(a: Date, b: Date): boolean;
    /**
     * Checks if two dates are in the same minute in the configured timezone.
     * @param a The first date.
     * @param b The second date.
     * @returns True if the dates are in the same minute, false otherwise.
     */
    isSameMinute(a: Date, b: Date): boolean;
    /**
     * Checks if two dates are in the same second in the configured timezone.
     * @param a The first date.
     * @param b The second date.
     * @returns True if the dates are in the same second, false otherwise.
     */
    isSameSecond(a: Date, b: Date): boolean;
}

declare const _: lodash__default.LoDashStatic;

declare const utils: {
    DateUtil: typeof DateUtil;
    _: lodash.LoDashStatic;
};

interface IJwtPayload extends JwtPayload {
    [key: string]: any;
}
interface IJwtSignOptions extends SignOptions {
}
interface IJwtVerifyOptions extends VerifyOptions {
}
interface AuthenticatedRequest extends Request {
    user?: IJwtPayload;
}
interface IJwtManager {
    setSecret(secret: string): void;
    sign(payload: object, options?: IJwtSignOptions): string;
    verify<T = any>(token: string, options?: IJwtVerifyOptions): T;
    decode(token: string): JwtPayload | null;
    extract(req: Request): string | null;
    authMiddleware(): (req: Request, res: Response, next: NextFunction) => void;
}

declare class JwtManager implements IJwtManager {
    private _secret;
    constructor();
    setSecret(secret: string): void;
    private getSecretOrThrow;
    /**
     * Signs a JWT token.
     * @param payload The payload to sign.
     * @param options Optional signing options.
     * @returns The signed JWT token.
     */
    sign(payload: object, options?: IJwtSignOptions): string;
    /**
     * Verifies a JWT token.
     * @param token The JWT token to verify.
     * @param options Optional verification options.
     * @returns The decoded JWT payload.
     * @throws AppError if the token is invalid or secret is missing.
     */
    verify<T = any>(token: string, options?: IJwtVerifyOptions): T;
    /**
     * Decodes a JWT token without verifying its signature.
     * @param token The JWT token to decode.
     * @returns The decoded JWT payload or null if decoding fails.
     */
    decode(token: string): IJwtPayload | null;
    /**
     * Extracts the Bearer token from the Authorization header of an Express request.
     * @param req The Express request object.
     * @returns The extracted token string or null if not found.
     */
    extract(req: Request): string | null;
    /**
     * Express middleware for JWT authentication.
     * Extracts, verifies, and attaches the user payload to the request.
     * Throws AppError (401) if token is missing, invalid, or expired.
     * @returns Express middleware function.
     */
    authMiddleware(): (req: Request, res: Response, next: NextFunction) => void;
}

declare const jwt: JwtManager;

type CloudProvider = 'aws' | 'gcp' | 'azure';
interface AwsCredentials {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
}
interface GcpCredentials {
    gcpKeyFilePath?: string;
    projectId?: string;
}
interface AzureCredentials {
    azureConnectionString: string;
}
type SpecificCredentials = ({
    provider: 'aws';
} & AwsCredentials) | ({
    provider: 'gcp';
} & GcpCredentials) | ({
    provider: 'azure';
} & AzureCredentials);
interface GlobalUploadConfig {
    defaultProvider: CloudProvider;
    credentials: SpecificCredentials;
}
interface UploadOptions {
    provider?: CloudProvider;
    key: string;
    mimeType?: string;
    bucket?: string;
    isRequired?: boolean;
    credentials?: SpecificCredentials;
}
interface PresignOptions {
    provider?: CloudProvider;
    key: string;
    mimeType?: string;
    bucket?: string;
    credentials?: SpecificCredentials;
    expiresIn?: number;
}
interface UploadResult {
    url: string;
    key: string;
    bucket?: string;
    provider: CloudProvider;
}

declare class UploadManager {
    private globalConfig;
    private adapters;
    constructor();
    configure(config: GlobalUploadConfig): void;
    private getAdapter;
    private resolveOptions;
    uploadFile(bufferOrStream: Buffer | Readable, options: UploadOptions): Promise<UploadResult>;
    generatePresignedUrl(options: PresignOptions): Promise<{
        url: string;
        fields?: any;
    }>;
}
declare const uploadManager: UploadManager;

export { type AuthenticatedRequest, type BaseDocument, type BaseJobData, BaseRepository, type CloudProvider, type ConfigManager, DateUtil, type EmailOptions, type EmailProvider, type EmailResult, type IJwtManager, type IJwtPayload, type IJwtSignOptions, type IJwtVerifyOptions, type JobOptions, MongoManager, type MongooseModel, type PlaceholderType, type PostgresConnectionConfig, type PresignOptions, type QueueConfig, type SchemaDefinition, SendGridProvider, type SendGridProviderOptions, SmtpProvider, type SmtpProviderOptions, type UploadOptions, type UploadResult, _, cacheDel, cacheGet, cacheSet, config, connectPostgres, connectRedis, createModel, createQueue, createRepository, createWorker, disconnectAllRedis, disconnectSpecificRedis, email, index as errors, getDrizzleClient, getQueue, getRedis, jwt, index$1 as logger, publish, subscribe, uploadManager, utils, v, validate };
