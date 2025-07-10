@vik/baselib

A modular, developer-friendly TypeScript library for Node.js backend services. @vik/baselib helps your team move faster by offering plug-and-play solutions for config, logging, database, queues, uploads, auth, and more — all with zero boilerplate.

⸻

🚀 Quickstart

# Install (from release branch)

pnpm add git+https://github.com/vikashverma/base-lib.git#release

// Use any module instantly
import { config, logger, jwt, uploadFile } from '@vik/baselib';

⸻

📚 Modules Overview

Category Module Description
Core Config, Logger, Errors, Validator App-wide utilities
Databases MongoDB, Postgres Schema + Repo pattern, multi-connection
Infra Redis, Queue Cache, pub/sub, BullMQ jobs
Auth JWT Stateless auth + middleware
Integration Email, File Upload SendGrid, SMTP, S3/GCP/Azure uploader
Utilities DateUtil, Lodash \_ Timezone dates, deep utils

⸻

🔧 Core Modules

✅ Config

The `config` module now supports eager validation of environment variables against a Zod schema at application startup, ensuring that your application only runs with a valid configuration.

```ts
import { config } from "@vik/baselib/config";
import { z } from "zod";

// Define your environment schema
const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_HOST: z.string().default("localhost"),
  PORT: z.string().default("3000"),
  // Add other environment variables specific to your project
});

// Load and validate config at application startup
// This will throw an AppError if validation fails, preventing the app from starting with bad config
type AppConfig = z.infer<typeof EnvSchema>;
const appConfig = config.loadAndValidate<typeof EnvSchema>(EnvSchema);

// Access validated config values
console.log(appConfig.DATABASE_URL);

// You can still use the traditional getters, which will now pull from the validated config
const port = config.getOrDefault("PORT", "3000");
const optionalRedisHost = config.getOptional("REDIS_HOST");
```

**Key Benefits:**

- **Fail-fast validation:** Catches misconfigurations at startup, preventing runtime errors.
- **Type safety:** Provides fully typed environment variables based on your Zod schema.
- **Multi-project compatibility:** Each consuming project can define and enforce its own unique environment schema.

✅ Logger

import { logger } from '@vik/baselib/logger';
logger.info('Server started');
logger.child({ module: 'auth' }).warn('Login failed');

✅ Error Handling

The error handling module now provides extended capabilities for reporting errors to external services like Sentry.

```ts
import { AppError, handleError } from "@vik/baselib/errors";
import { ErrorType } from "@vik/baselib/errors";
import { SentryErrorReporter } from "@vik/baselib/errors/sentry.reporter"; // New import
import { logger } from "@vik/baselib/logger"; // Assuming logger is configured
import * as Sentry from "@sentry/node"; // You'll need to install @sentry/node in your project

// Initialize Sentry in your application's bootstrap
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  // Add other Sentry configurations
});

// Create a Sentry error reporter instance
const sentryReporter = new SentryErrorReporter(Sentry);

// Throwing a structured error
try {
  throw new AppError("Invalid input", 400, ErrorType.VALIDATION, {
    field: "email",
  });
} catch (err) {
  // Handling errors with optional logging and Sentry reporting
  const { statusCode, message, type } = handleError(err, {
    logger: logger, // Log to your application logger
    errorReporter: sentryReporter, // Report to Sentry
    traceId: "some-request-trace-id", // Optional trace ID for correlation
  });
  // Respond with statusCode/message/type (e.g., in Express, Fastify, etc.)
  // res.status(statusCode).json({ message, type });
}

// Express example with Sentry integration:
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const { statusCode, message, type } = handleError(err, {
      logger: logger,
      errorReporter: sentryReporter,
      traceId: req.headers["x-request-id"] as string, // Example: pass request ID
    });
    res.status(statusCode).json({ message, type });
  }
);
```

**Key Benefits:**

- **Centralized error reporting:** Easily integrate with error tracking services like Sentry.
- **Enhanced observability:** Automatically reports `AppError` instances with context to your monitoring tools.
- **Flexible integration:** You can choose to provide an `errorReporter` or not, depending on your project's needs.

✅ Validation (Zod-based)

import { v } from '@vik/baselib/validator';
const input = v.validate({ email: v.string().email() }, req.body);

⸻

🧩 Database Modules

🗃️ MongoDB

import { MongoManager, createModel, BaseRepository } from '@vik/baselib/mongo';
await MongoManager.getInstance().connect('main', 'mongodb://...');
const User = createModel('User', { name: String }, 'main');
class UserRepo extends BaseRepository { ... }

🐘 Postgres (Drizzle ORM)

The PostgreSQL module now provides a unified, Drizzle-based repository pattern for type-safe and flexible data access.

```ts
import { connectPostgres, createRepository } from "@vik/baselib/postgres";
import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { InferSelectModel, InferInsertModel } from "drizzle-orm"; // Import these types for convenience

// 1. Define your table schema using Drizzle's pgTable
const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: text("created_at").defaultNow(),
});

// Define types for your model
type UserSelect = InferSelectModel<typeof users>;
type UserInsert = InferInsertModel<typeof users>;

// 2. Connect to your database
connectPostgres("main", {
  user: "postgres",
  password: "password",
  host: "localhost",
  port: 5432,
  database: "testdb",
});

// 3. Create a repository for your schema
const UserRepository = createRepository(users, "main");

// 4. Use the repository for CRUD operations
async function exampleUsage() {
  // Insert
  const newUser = await UserRepository.insert({
    name: "Alice",
    email: "alice@example.com",
  });
  console.log("Inserted user:", newUser);

  // Find by ID
  const userById = await UserRepository.findById(newUser.id);
  console.log("Found user by ID:", userById);

  // Find all
  const allUsers = await UserRepository.findAll();
  console.log("All users:", allUsers);

  // Update
  const updatedUser = await UserRepository.update(newUser.id, {
    name: "Alicia",
  });
  console.log("Updated user:", updatedUser);

  // Delete
  await UserRepository.delete(newUser.id);
  console.log("User deleted.");
}

exampleUsage();
```

**Key Benefits:**

- **Type-safe queries:** Leverage Drizzle ORM's strong typing for all database operations.
- **Schema flexibility:** Each consuming project defines and uses its own Drizzle schemas, making the library adaptable to diverse database structures.
- **Consistent API:** Provides a standardized repository interface for all your Drizzle-backed models.

**Database Migrations (for consuming projects):**

While `@vik/baselib` provides the `createRepository` function, **managing database schema migrations is handled by the consuming project** using `drizzle-kit`.

1.  **Configure Drizzle Kit:** Create a `drizzle.config.ts` in your consuming project's root:

    ```ts
    // drizzle.config.ts (in your consuming project)
    import { defineConfig } from "drizzle-kit";
    import { config } from "@vik/baselib/config";

    // Ensure your DATABASE_URL is set in your project's .env
    config.get("DATABASE_URL");

    export default defineConfig({
      schema: "./src/db/schema.ts", // Path to YOUR project's Drizzle schema files
      out: "./drizzle", // Directory for YOUR project's migrations
      dialect: "postgresql",
      dbCredentials: {
        url: config.get("DATABASE_URL"),
      },
      verbose: true,
      strict: true,
    });
    ```

2.  **Define Your Schema:** Create your Drizzle schema files (e.g., `src/db/schema.ts`) in your consuming project.
3.  **Generate Migrations:**
    ```bash
    npx drizzle-kit generate --config=drizzle.config.ts
    ```
4.  **Run Migrations:** Create a script in your consuming project (e.g., `scripts/migrate.ts`) to apply migrations:

    ```ts
    // scripts/migrate.ts (in your consuming project)
    import { drizzle } from "drizzle-orm/node-postgres";
    import { migrate } from "drizzle-orm/node-postgres/migrator";
    import { Pool } from "pg";
    import { config } from "@vik/baselib/config"; // Use the library's config

    async function runMigrations() {
      const dbUrl = config.get("DATABASE_URL");
      if (!dbUrl) {
        throw new Error(
          "DATABASE_URL is not set in the environment variables."
        );
      }

      const pool = new Pool({ connectionString: dbUrl });
      const db = drizzle(pool);

      try {
        console.log("Running database migrations...");
        await migrate(db, { migrationsFolder: "./drizzle" }); // Path to YOUR project's migrations
        console.log("Migrations completed successfully.");
      } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
      } finally {
        await pool.end();
      }
    }

    runMigrations();
    ```

    Then add a script to your project's `package.json`:

    ```json
    "scripts": {
      "db:migrate": "ts-node scripts/migrate.ts"
    }
    ```

    And run: `npm run db:migrate` (or `pnpm run db:migrate`).

This setup ensures that each project handles its own schema lifecycle independently, while still benefiting from the library's Drizzle integration.

⸻

⚙️ Infrastructure

🔁 Redis

import { connectRedis, cacheSet, cacheGet } from '@vik/baselib/redis';
connectRedis('main', { host: 'localhost' });
await cacheSet('key', { val: 1 }, 60);

📥 Queue (BullMQ)

import { createQueue, createWorker } from '@vik/baselib/queue';
const emailQueue = createQueue('email');
await emailQueue.add('send', { to: 'test@x.com' });
createWorker('email', async (job) => { ... });

⸻

📬 Integration

✉️ Email (SendGrid + SMTP fallback)

import { email } from '@vik/baselib/email';
email.setDefaultSendGrid({ apiKey, from });
email.sendEmail({ to, subject, text });

☁️ File Uploads (S3, GCP, Azure)

import { uploadFile, generatePresignedUrl } from '@vik/baselib/upload';
await uploadFile(fileBuffer, { provider: 'aws', key: 'uploads/img.png' });
await generatePresignedUrl({ provider: 'gcp', key: 'temp.pdf' });

⸻

🔐 JWT Auth

import { jwt } from '@vik/baselib/jwt';
jwt.setSecret('your-secret');
const token = jwt.sign({ userId: 'abc' });
const payload = jwt.verify(token);
app.use('/secure', jwt.authMiddleware());

⸻

🛠️ Utilities

🕒 DateUtil (timezone-aware)

import { DateUtil } from '@vik/baselib/utils';
new DateUtil('Asia/Kolkata').now();

🧱 Lodash (\_)

import { _ } from '@vik/baselib/utils';
_.pick(user, ['id', 'email']);
_.uuid(); _.sleep(1000);

⸻

🧪 Testing

pnpm test # run all tests
pnpm test:coverage # check coverage

    •	Pure unit tests, no real service dependencies
    •	Mocks for Redis, DB, JWT, etc.

⸻

📦 Build & Release

pnpm build # compile everything
pnpm push # push full source to main branch
pnpm release # push compiled dist to release branch

⸻

💡 Philosophy
• Modular, decoupled, lazy-loaded
• Plug-and-play DX: one import to get going
• Minimal external config — conventions over config
• Team-ready, with no setup required

⸻

🤝 Contributing

Private internal library. Contact Vikash for access or extension guidelines.

⸻

📄 License

MIT
