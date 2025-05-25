// src/postgres/repository.factory.ts

import { Pool, PoolClient } from 'pg';
import { SchemaBuilder } from './schema.builder';

// Define a generic type for the repository based on the schema
export type Repository<T extends object> = {
  insert: (data: T) => Promise<T>;
  update: (id: any, data: Partial<T>) => Promise<T | undefined>;
  findAll: () => Promise<T[]>;
  findById: (id: any) => Promise<T | undefined>;
  delete: (id: any) => Promise<void>;
  // TODO: Add optional where, join, limit helpers
};

// Function to create typed repository objects
export function createRepository<T extends object>(pool: Pool | PoolClient, tableName: string, schemaDefinition: Record<string, string>): Repository<T> {
  const schemaBuilder = new SchemaBuilder();
  const createTableSql = schemaBuilder.buildCreateTableStatement(tableName, schemaDefinition);

  // Execute CREATE TABLE statement (fire and forget, or handle initial setup elsewhere)
  pool.query(createTableSql).catch(console.error); // Basic error handling

  const insert = async (data: T): Promise<T> => {
    const columns = Object.keys(data).join(', ');
    const valuesPlaceholders = Object.keys(data).map((_, i) => `$\${i + 1}`).join(', ');
    const values = Object.values(data);
    const sql = `INSERT INTO "${tableName}" (${columns}) VALUES (${valuesPlaceholders}) RETURNING *;`;
    const result = await pool.query(sql, values);
    return result.rows[0];
  };

  const update = async (id: any, data: Partial<T>): Promise<T | undefined> => {
    const setClauses = Object.keys(data)
      .map((key, i) => `"${key}" = $\${i + 2}`).join(', ');
    const values = [id, ...Object.values(data)];
    const sql = `UPDATE "${tableName}" SET ${setClauses} WHERE id = $1 RETURNING *;`;
    const result = await pool.query(sql, values);
    return result.rows[0];
  };

  const findAll = async (): Promise<T[]> => {
    const sql = `SELECT * FROM "${tableName}";`;
    const result = await pool.query(sql);
    return result.rows;
  };

  const findById = async (id: any): Promise<T | undefined> => {
    const sql = `SELECT * FROM "${tableName}\" WHERE id = $1;`;
    const result = await pool.query(sql, [id]);
    return result.rows[0];
  };

  const del = async (id: any): Promise<void> => {
    const sql = `DELETE FROM \"${tableName}\" WHERE id = $1;`;
    await pool.query(sql, [id]);
  };

  return {
    insert,
    update,
    findAll,
    findById,
    delete: del, // 'delete' is a reserved keyword
  };
} 