import { defineConfig } from 'drizzle-kit';
import { config } from './src/config';

// Load environment variables for Drizzle Kit
config.get('DATABASE_URL'); // This ensures .env is loaded

export default defineConfig({
    schema: './src/postgres/schema.ts',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        url: config.get('DATABASE_URL'),
    },
    verbose: true,
    strict: true,
});
