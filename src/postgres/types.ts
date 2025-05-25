// src/postgres/types.ts

// Define your custom types and interfaces here
export interface PlaceholderType {}

export type PostgresConnectionConfig = {
  user: string;
  password: string;
  host: string;
  port: number;
  database: string;
};

export type { InferModel, Table } from 'drizzle-orm'; 