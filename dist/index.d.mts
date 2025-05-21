import { Connection, Document, SchemaDefinition as SchemaDefinition$1, Model, FilterQuery, UpdateQuery } from 'mongoose';
import Redis, { RedisOptions } from 'ioredis';
export { RedisOptions } from 'ioredis';

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

export { type BaseDocument, BaseRepository, MongoManager, type MongooseModel, type SchemaDefinition, connectRedis, createModel, disconnectAllRedis, disconnectSpecificRedis, getRedis };
