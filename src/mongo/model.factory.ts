import mongoose, { Schema } from 'mongoose';
import MongoManager from './mongo.manager';
import { SchemaDefinition, MongooseModel, BaseDocument } from './types';

export function createModel<T extends BaseDocument>(
  name: string,
  schemaDef: SchemaDefinition<T>,
  connectionName: string
): MongooseModel<T> {
  const mongoManager = MongoManager.getInstance();
  const connection = mongoManager.getConnection(connectionName);

  const schema = new Schema<T>(schemaDef, { timestamps: true });

  // Check if the model already exists on the connection to prevent Mongoose from recompiling it
  if (connection.models[name]) {
    return connection.models[name] as MongooseModel<T>;
  }

  return connection.model<T>(name, schema) as MongooseModel<T>;
}
