import { SchemaDefinition as MongooseSchemaDefinition, Document, Model } from 'mongoose';

export type SchemaDefinition<T> = MongooseSchemaDefinition<T>;

export interface BaseDocument extends Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

export type MongooseModel<T extends BaseDocument> = Model<T>;
