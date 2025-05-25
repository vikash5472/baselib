# @vik/baselib

A private, modular TypeScript library for backend Node.js projects, providing reusable, decoupled utilities for configuration, database, cache, queue, and more. Built for clean developer experience, minimal overhead, and strong testability.

---

## 🚀 Features
- **Config utility**: Lazy, on-demand env loading, no side effects until used
- **MongoDB**: Connection manager, schema/model/repository pattern, multi-DB support
- **Redis**: Multi-client manager, cache, pub/sub utilities
- **Queue**: BullMQ-based, strongly typed jobs, works with named Redis clients
- **Postgres**: Drizzle ORM-based, multi-connection, type-safe repositories
- **Pure unit tests**: Fast, reliable, no external dependencies
- **pnpm-first**: All workflows use pnpm

---

## 📦 Installation

> **Note:** This project uses [pnpm](https://pnpm.io/) as its package manager. Please use pnpm for all install, build, test, and release workflows.

Install the library from the release branch:

```sh
pnpm install git+https://github.com/vikashverma/base-lib.git#release
```

---

## 🛠 Usage

### 1. Config Utility

```ts
import { config } from '@vik/baselib';

// Throws if missing
const POSTGRES_URL = config.get('POSTGRES_URL');

// Optional value
const optional = config.getOptional('OPTIONAL_ENV');

// Fallback value
const redisHost = config.getOrDefault('REDIS_HOST', 'localhost');

// Manual validation
config.validate(['POSTGRES_URL', 'REDIS_HOST']);

// Zod schema validation (if you use zod)
import { z } from 'zod';
const schema = z.object({ POSTGRES_URL: z.string().url() });
const validated = config.validateWithSchema(schema);
```

### 2. MongoDB Module

```ts
import { MongoManager, createModel, BaseRepository, BaseDocument } from '@vik/baselib/mongo';

// 1. Connect to a database
const mongoManager = MongoManager.getInstance();
await mongoManager.connect('main', 'mongodb://localhost:27017/mydb');

// 2. Define schema and model
interface IUser extends BaseDocument {
  name: string;
  email: string;
}
const UserSchemaDef = { name: { type: String }, email: { type: String } };
const UserModel = createModel<IUser>('User', UserSchemaDef, 'main');

// 3. Repository pattern
class UserRepository extends BaseRepository<IUser> {
  constructor() { super(UserModel); }
}
const userRepository = new UserRepository();

// 4. CRUD
await userRepository.create({ name: 'Alice', email: 'alice@example.com' });
const users = await userRepository.findAll();
```

### 3. Redis Module

```ts
import { connectRedis, getRedis, cacheSet, cacheGet, publish, subscribe } from '@vik/baselib/redis';

// Connect to Redis
connectRedis('main', { host: 'localhost', port: 6379 });
const redis = getRedis('main');

// Set/Get
await redis.set('foo', 'bar');
const val = await redis.get('foo');

// Cache helpers
await cacheSet('user:1', { id: 1, name: 'Test' }, 60);
const cached = await cacheGet('user:1');

// Pub/Sub
subscribe('news', msg => console.log('Got:', msg));
await publish('news', 'hello-world');
```

### 4. Queue Module

```ts
import { connectRedis } from '@vik/baselib/redis';
import { createQueue, createWorker } from '@vik/baselib/queue';

// Setup
connectRedis('jobs', { host: 'localhost', port: 6379 });

// Producer
const emailQueue = createQueue('email', 'jobs');
await emailQueue.add('sendMail', { to: 'vikash@example.com' });

// Consumer
createWorker('email', async (job) => {
  console.log('Sending email to', job.data.to);
});
```

### 5. Postgres Module (Drizzle ORM)

```ts
import { connectPostgres, createRepository } from '@vik/baselib/postgres';
import { pgTable, text, uuid } from 'drizzle-orm/pg-core';

// 1. Define your table schema
const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
});

// 2. Connect to your database
connectPostgres('main', {
  user: 'postgres',
  password: 'password',
  host: 'localhost',
  port: 5432,
  database: 'testdb',
});

// 3. Create a repository
const UserRepo = createRepository(users, 'main');

// 4. Use the repository
await UserRepo.insert({ name: 'Vikash' });
const list = await UserRepo.findAll();
```

---

## 🧪 Testing & Coverage

- **Unit tests** use pure in-memory mocks for all modules (no external dependencies).
- **Run all unit tests:**
  ```sh
  pnpm test
  ```
- **Coverage:**
  ```sh
  pnpm test:coverage
  ```
- 100% coverage for config utility and high coverage for other modules.

---

## 🏗️ Development & Release

- **pnpm** is required for all workflows.
- **Build:**
  ```sh
  pnpm run build
  ```
- **Push changes:**
  ```sh
  pnpm run push
  ```
- **Release:**
  ```sh
  pnpm run release
  ```

---

## 💡 Philosophy
- **Decoupled:** Each module is responsible for its own config and validation.
- **Lazy:** No side effects or env loading until actually used.
- **Testable:** Pure unit tests with mocks, no reliance on external services.
- **Modern:** Uses pnpm, TypeScript, and best practices for backend libraries.

---

## 🤝 Contributing
This is a private library. For access or collaboration, contact the maintainer.

---

## 📄 License
MIT
