import { pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { connectPostgres, createRepository } from './index';

const users = pgTable('users_test', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
});

async function runPostgresTest() {
  connectPostgres('test', {
    user: 'postgres',
    password: 'password',
    host: 'localhost',
    port: 5432,
    database: 'testdb',
  });

  const UserRepo = createRepository(users, 'test');

  // Insert
  await UserRepo.insert({ name: 'Test User' });
  console.log('Inserted user');

  // Find all
  const all = await UserRepo.findAll();
  console.log('All users:', all);

  // Find by id
  if (all.length > 0) {
    const user = await UserRepo.findById(all[0].id);
    console.log('Found by id:', user);

    // Delete
    await UserRepo.delete(all[0].id);
    console.log('Deleted user');
  }

  // Final check
  const after = await UserRepo.findAll();
  console.log('Users after delete:', after);
}

runPostgresTest().catch(console.error); 