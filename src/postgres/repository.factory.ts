import { eq, InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { PgTable, PgColumn } from 'drizzle-orm/pg-core';
import { getDrizzleClient } from './postgres.manager';

// Constrain T to be a PgTable that has an 'id' column for generic operations.
type TableWithId = PgTable & {
  id: PgColumn;
};

export function createRepository<T extends TableWithId>(schema: T, connectionName: string) {
  const db: any = getDrizzleClient(connectionName);

  type SelectModel = InferSelectModel<T>;
  type InsertModel = InferInsertModel<T>;
  type IdType = SelectModel['id'];

  return {
    async findById(id: IdType): Promise<SelectModel | undefined> {
      const result = await db.select().from(schema).where(eq(schema.id, id)).limit(1);
      return result[0];
    },

    async findAll(): Promise<SelectModel[]> {
      return db.select().from(schema);
    },

    async insert(data: InsertModel): Promise<SelectModel> {
      const result = await db.insert(schema).values(data).returning();
      return result[0];
    },

    async update(id: IdType, data: Partial<InsertModel>): Promise<SelectModel | undefined> {
      const result = await db.update(schema).set(data).where(eq(schema.id, id)).returning();
      return result[0];
    },

    async delete(id: IdType): Promise<void> {
      await db.delete(schema).where(eq(schema.id, id));
    },
  };
}
