# @vik/baselib

A private npm-compatible TypeScript library for backend projects, providing reusable utilities.

## Installation

This library is intended for private use and can be installed directly from its Git repository. For the `release` branch, which contains the compiled `dist/` folder:

```bash
npm install git+https://github.com/vikashverma/base-lib.git#release
```

## Usage

### MongoDB Module

The `@vik/baselib` MongoDB module provides a robust, reusable solution for managing MongoDB connections, defining schemas, instantiating models, and performing CRUD operations using a generic repository pattern. It supports multiple database connections.

#### 1. Connect to Multiple Databases

Use `MongoManager` to establish and manage connections to different MongoDB instances or databases.

```typescript
import { MongoManager } from '@vik/baselib/mongo';

const mongoManager = MongoManager.getInstance();

const PRIMARY_DB_URI = 'mongodb://localhost:27017/primary_db';
const SECONDARY_DB_URI = 'mongodb://localhost:27017/secondary_db';

async function connectDatabases() {
  try {
    await mongoManager.connect('primary', PRIMARY_DB_URI);
    await mongoManager.connect('secondary', SECONDARY_DB_URI);
    console.log('All databases connected.');
  } catch (error) {
    console.error('Failed to connect databases:', error);
    process.exit(1);
  }
}

connectDatabases();
```

#### 2. Define Schema, Get Model, and Instantiate Repository

Define your document interfaces, schema definitions, and then use `createModel` to get a Mongoose model bound to a specific connection. Finally, instantiate `BaseRepository` for type-safe CRUD operations.

```typescript
import { SchemaDefinition, BaseDocument, createModel, BaseRepository } from '@vik/baselib/mongo';

// 1. Define your Document Interface
interface IUser extends BaseDocument {
  name: string;
  email: string;
  age?: number;
}

// 2. Define the Schema Definition
const UserSchemaDef: SchemaDefinition<IUser> = {
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  age: { type: Number },
};

// 3. Get the Mongoose Model bound to a specific connection
//    Ensure 'primary' connection is established before calling createModel
const UserModel = createModel<IUser>('User', UserSchemaDef, 'primary');

// 4. Instantiate the BaseRepository
class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(UserModel);
  }
}

const userRepository = new UserRepository();
```

#### 3. Sample CRUD Usage

Once you have your repository, perform CRUD operations with full type safety.

```typescript
import { MongoManager } from '@vik/baselib/mongo';
// ... (imports for SchemaDefinition, BaseDocument, createModel, BaseRepository, IUser, UserSchemaDef, UserModel, UserRepository, userRepository from above)

async function runCrudOperations() {
  // Ensure connections are established
  await MongoManager.getInstance().connect('primary', 'mongodb://localhost:27017/primary_db');

  console.log('\n--- CRUD Operations ---');

  // Create
  const newUser = await userRepository.create({ name: 'Alice', email: 'alice@example.com', age: 30 });
  console.log('Created User:', newUser);

  // Find All
  const allUsers = await userRepository.findAll();
  console.log('All Users:', allUsers);

  // Find By ID
  const foundUser = await userRepository.findById(newUser._id);
  console.log('Found User by ID:', foundUser);

  // Update
  if (foundUser) {
    const updatedUser = await userRepository.update(foundUser._id, { age: 31 });
    console.log('Updated User:', updatedUser);
  }

  // Delete
  if (newUser) {
    const deletedUser = await userRepository.delete(newUser._id);
    console.log('Deleted User:', deletedUser);
  }

  // Disconnect from a specific database
  await MongoManager.getInstance().disconnect('primary');
  console.log('Disconnected from primary_db.');

  // Or disconnect all databases
  // await MongoManager.getInstance().disconnect();
  // console.log('Disconnected from all databases.');
}

runCrudOperations();

### Redis Module

The `@vik/baselib` Redis module provides a clean, typed connection utility using `ioredis`, supporting multiple Redis instances.

```typescript
import { connectRedis, getRedis } from '@vik/baselib/redis'; // Note: import from /redis

// Connect to a primary Redis instance
connectRedis('primary', {
  host: 'localhost',
  port: 6379,
  password: 'your_primary_redis_password', // Replace with your actual password
});

// Connect to a secondary Redis instance (e.g., for caching)
connectRedis('cache', {
  host: 'localhost',
  port: 6380,
  password: 'your_cache_redis_password', // Replace with your actual password
});

async function useRedisInstances() {
  try {
    // Get the primary Redis client
    const primaryRedis = getRedis('primary');
    await primaryRedis.set('app:status', 'online');
    console.log('Primary Redis status:', await primaryRedis.get('app:status'));

    // Get the cache Redis client
    const cacheRedis = getRedis('cache');
    await cacheRedis.setex('user:123:data', 3600, 'some_cached_user_data'); // Set with expiry
    console.log('Cache Redis data for user 123:', await cacheRedis.get('user:123:data'));

  } catch (error) {
    console.error('Error using Redis:', error);
  } finally {
    // Disconnect specific Redis instances
    // await disconnectSpecificRedis('primary');
    // await disconnectSpecificRedis('cache');

    // Or disconnect all Redis instances
    // await disconnectAllRedis();
    console.log('Redis instances usage complete.');
  }
}

useRedisInstances();
```

#### Caching and Pub/Sub Utilities

The Redis module also provides utilities for caching with JSON serialization and a simple Pub/Sub abstraction.

```typescript
import { connectRedis, cacheSet, cacheGet, publish, subscribe } from '@vik/baselib';

// Redis Connection
connectRedis('cache', { host: 'localhost', port: 6379 });

async function runRedisUtilities() {
  // Caching
  await cacheSet('user:1', { id: 1, name: 'Vikash' }, 60);
  const user = await cacheGet('user:1');
  console.log('Cached User:', user);

  // Pub/Sub
  subscribe('news', msg => console.log('Got:', msg));
  await publish('news', 'hello-world');
  console.log('Published message to news channel.');
}

runRedisUtilities();
```

### Queue Module

The `@vik/baselib` Queue module provides a robust, reusable solution for managing BullMQ queues and workers, supporting multiple Redis instances and strongly typed jobs.

```typescript
import {
  connectRedis,
  createQueue,
  getQueue,
  createWorker,
} from '@vik/baselib';

// Setup
connectRedis('jobs', { host: 'localhost', port: 6379 });

async function runQueueExample() {
  // Producer
  const emailQueue = createQueue('email', 'jobs');
  await emailQueue.add('sendMail', { to: 'vikash@example.com' });
  console.log('Added job to email queue.');

  // Consumer
  createWorker('email', async (job) => {
    console.log('Sending email to', job.data.to);
  });
  console.log('Email worker created.');
}

runQueueExample();
```

## 📦 PostgreSQL Module (Drizzle ORM)

### Features
- Connect to one or multiple PostgreSQL databases by name
- Define your own schema using Drizzle's `pgTable`
- Generate lightweight, strongly-typed repositories
- Perform readable, type-safe queries
- Minimal boilerplate
- Raw query access via `.db`
- Custom primary key support

### Installation
```sh
npm install drizzle-orm pg
npm install -D drizzle-kit
```

### Directory Structure
```
base-lib/
└── src/
    └── postgres/
        ├── postgres.manager.ts         // Connect & store named clients
        ├── repo.factory.ts             // Accept schema + table and return repo
        ├── query.helpers.ts            // Optional advanced query utilities
        ├── types.ts                    // Shared types (DB config, repo utils)
        └── index.ts                    // Unified export
```

### Usage Example
```ts
import { pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { connectPostgres, createRepository } from '@vik/baselib/postgres';

// 1. Define your table schema
const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
});

// 2. Connect to your database (can be called multiple times for different DBs)
connectPostgres('main', {
  user: 'postgres',
  password: 'password',
  host: 'localhost',
  port: 5432,
  database: 'testdb',
});

// 3. Create a repository for your table
const UserRepo = createRepository(users, 'main');

// 4. Use the repository
await UserRepo.insert({ name: 'Vikash' });
const list = await UserRepo.findAll();
const user = await UserRepo.findById(list[0].id);
await UserRepo.delete(list[0].id);

// 5. Raw Drizzle client access
UserRepo.db // Use for advanced queries
```

### API Reference

#### `connectPostgres(name: string, config: PostgresConnectionConfig): void`
Connects and stores a named PostgreSQL connection using Drizzle ORM.
- `name`: Unique identifier for the connection
- `config`: `{ user, password, host, port, database }`

#### `getDrizzleClient(name: string): DrizzleClient`
Returns the Drizzle client for a given connection name.

#### `createRepository<T extends Table, PK = 'id'>(table: T, dbName = 'main', primaryKey = 'id')`
Returns a repository object for the given table and database.
- `insert(data)`: Insert a row
- `findAll()`: Get all rows
- `findById(id)`: Get row by primary key
- `delete(id)`: Delete row by primary key
- `.db`: Raw Drizzle client for advanced queries

#### Types
- `PostgresConnectionConfig`: `{ user, password, host, port, database }`
- `InferModel`, `Table`: Re-exported from Drizzle ORM for convenience

### Advanced
- You can connect to multiple databases by calling `connectPostgres` with different names.
- You can specify a custom primary key column name in `createRepository`.
- Use `.db` for raw Drizzle queries or transactions.
- Add your own helpers in `query.helpers.ts`.

## License
MIT
