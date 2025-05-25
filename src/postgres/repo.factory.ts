import { getDrizzleClient } from './postgres.manager';
import { InferModel, Table } from 'drizzle-orm';

export function createRepository<
  T extends Table,
  PK extends keyof InferModel<T, 'select'> = 'id'
>(
  table: T,
  dbName: string = 'main',
  primaryKey: PK = 'id' as PK
) {
  const db = getDrizzleClient(dbName);
  type InsertType = InferModel<T, 'insert'>;
  type SelectType = InferModel<T, 'select'>;

  return {
    db, // raw access
    insert: async (data: InsertType): Promise<void> => {
      await db.insert(table as any).values(data).returning();
    },
    findAll: async (): Promise<SelectType[]> => {
      return await db.select().from(table as any) as SelectType[];
    },
    findById: async (id: SelectType[PK]): Promise<SelectType | undefined> => {
      const rows = await db.select().from(table as any).where((table as any)[primaryKey].eq(id)) as SelectType[];
      return rows[0];
    },
    delete: async (id: SelectType[PK]): Promise<void> => {
      await db.delete(table as any).where((table as any)[primaryKey].eq(id)).returning();
    },
  };
} 