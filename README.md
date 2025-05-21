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
