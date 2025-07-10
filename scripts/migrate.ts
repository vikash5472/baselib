import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { config } from '../src/config';

async function runMigrations() {
    const dbUrl = config.get('DATABASE_URL');
    if (!dbUrl) {
        throw new Error('DATABASE_URL is not set in the environment variables.');
    }

    const pool = new Pool({ connectionString: dbUrl });
    const db = drizzle(pool);

    try {
        console.log('Running database migrations...');
        await migrate(db, { migrationsFolder: './drizzle' });
        console.log('Migrations completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigrations();
