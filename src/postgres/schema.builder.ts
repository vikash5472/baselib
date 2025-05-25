// src/postgres/schema.builder.ts

// Function or class to build SQL schema from object definition
export class SchemaBuilder {
  public buildCreateTableStatement(tableName: string, schemaDefinition: Record<string, string>): string {
    const columns = Object.entries(schemaDefinition)
      .map(([columnName, columnType]) => `"${columnName}" ${columnType}`)
      .join(', ');

    return `CREATE TABLE IF NOT EXISTS "${tableName}" (${columns});`;
  }
} 