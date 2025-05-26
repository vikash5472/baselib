# @vik/baselib

A private, modular TypeScript library for backend Node.js projects, providing reusable, decoupled utilities for configuration, database, cache, queue, and more. Built for clean developer experience, minimal overhead, and strong testability.

---

## 🚀 Features
- **Config utility**: Lazy, on-demand env loading, no side effects until used
- **Cloud-agnostic file upload**: Unified API for AWS S3, GCS, Azure Blob, with presigned URLs and lazy loading.
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

### 6. Email Module (SendGrid Default, SMTP Fallback)

Send emails with a unified API and automatic fallback from SendGrid (default) to SMTP (nodemailer) if SendGrid fails.

```ts
import { email } from '@vik/baselib/email';

// 1. Set SendGrid as the default provider (required)
email.setDefaultSendGrid({
  apiKey: 'SENDGRID_API_KEY',
  from: 'noreply@example.com',
});

// 2. Optionally set SMTP as the secondary (fallback) provider
email.setSecondarySmtp({
  host: 'smtp.example.com',
  port: 587,
  auth: { user: 'user', pass: 'pass' },
  from: 'noreply@example.com',
});

// 3. Send an email (uses SendGrid, falls back to SMTP if needed)
await email.sendEmail({
  to: 'user@example.com',
  subject: 'Welcome!',
  text: 'Hello world',
  html: '<b>Hello world</b>',
});
```

- **Default:** SendGrid is used for all emails.
- **Fallback:** If SendGrid fails (e.g., network error, quota), SMTP is automatically tried if configured.
- **Custom:** You can use `email.setProvider(...)` and `email.setSecondaryProvider(...)` for custom providers.

> **Dependencies:**
> - For SendGrid, `@sendgrid/mail` is required (already included).
> - For SMTP, `nodemailer` and `@types/nodemailer` are required (already included).
> - For other providers, install their respective SDKs if you implement them.

> You can add more providers (Mailgun, SES, etc.) by implementing the `EmailProvider` interface.

### 7. Logger Module (Pino-based, Singleton)

A high-performance, singleton logger using [pino](https://getpino.io/), with structured logging, context support, and pretty-printing in development.

```ts
import { logger } from '@vik/baselib/logger';

logger.info('Server started');
logger.error('Something went wrong', { err: error });

// With context (child logger)
const authLogger = logger.child({ module: 'auth', requestId: 'abc123' });
authLogger.info('User login started');
```

- **Singleton:** Shared across your app, never re-initialized
- **Context:** Use `logger.child({ ... })` for per-request or per-module context
- **Pretty in dev:** Pretty-prints logs if `NODE_ENV` is not production
- **JSON in prod:** Outputs JSON logs in production
- **Extensible:** Future support for external transports (Sentry, CloudWatch, etc.)

> Uses `pino` (runtime) and `pino-pretty` (dev only). No config needed for basic use.

### 8. Centralized Error Handling Utility

A universal error handling utility for consistent error throwing, logging, and response formatting across all backend services.

```ts
import { AppError, ErrorType, handleError } from '@vik/baselib/errors';

// Throwing a structured error
throw new AppError('Invalid input', 400, ErrorType.VALIDATION, { field: 'email' });

// Handling errors in a framework-agnostic way
try {
  // ...
} catch (err) {
  const { statusCode, message, type } = handleError(err, { logger });
  // Respond with statusCode/message/type (e.g., in Express, Fastify, etc.)
}

// Express example:
app.use((err, req, res, next) => {
  const { statusCode, message, type } = handleError(err, { logger });
  res.status(statusCode).json({ message, type });
});
```

- **AppError:** Custom error class with status, type, context, and operational flag
- **ErrorType:** Enum for common error categories (VALIDATION, AUTH, NOT_FOUND, INTERNAL)
- **handleError:** Standardizes error logging and response, works with any framework
- **No framework lock-in:** Use in Express, Fastify, NestJS, etc.

#### 🛠️ FAQ: Cannot find module './error.types' or its corresponding type declarations

If you see this TypeScript error, but the file exists:

- Ensure the file is named exactly `error.types.ts` and is in the same directory as `app-error.ts`.
- Restart your editor or the TypeScript server (in VSCode: Cmd+Shift+P → "TypeScript: Restart TS Server").
- Clean build artifacts and rebuild:
  ```sh
  rm -rf dist
  pnpm build
  ```
- Make sure your `tsconfig.json` includes the `src/errors` directory.

This is usually an editor or build cache issue, not a code problem.

### 9. Validator Utility (Zod-powered, One-liner)

A high-DX validation utility for request bodies, queries, and more. No need to import zod separately—just use `v`.

```ts
import { v } from '@vik/baselib/validator';

// One-line validation
const input = v.validate({
  email: v.string().email(),
  age: v.number().int().min(18),
}, req.body);

// Use zod directly if needed
const schema = v.object({ id: v.string().uuid() });
const input2 = schema.parse(req.query);
```

- Throws `AppError` (400, VALIDATION) on failure, with zod error details
- No boilerplate, fully typed result
- Use with any framework

### 10. Date Utilities (Timezone-Aware `DateUtil` Class)

The `date.util.ts` module now provides a class-based `DateUtil` for comprehensive date and time operations with persistent timezone context. This allows you to set a timezone once and have all subsequent operations on that instance (or static calls) respect it.

**Design:**

```ts
class DateUtil {
  private static timezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone;

  constructor(tz?: string) {
    if (tz) DateUtil.timezone = tz;
  }

  now(): Date {
    // Returns current date/time in the configured timezone
  }

  format(date: Date, pattern?: string): string {
    // Formats date in the configured timezone using date-fns patterns
  }

  getTimezone(): string {
    // Returns the current timezone
  }

  static setTimezone(tz: string): void {
    // Sets the global default timezone for all instances
  }

  // ... other date utility methods (addDays, isFuture, startOfDay, etc.)
}
```

**Developer Usage:**

You can instantiate `DateUtil` with a specific timezone, or rely on the globally set default.

```ts
// file-1.ts
import { DateUtil } from '@vik/baselib/utils';

// Instantiate with a specific timezone, which also sets it globally
const istDateUtil = new DateUtil('Asia/Kolkata');
console.log('IST Now:', istDateUtil.now());
console.log('IST Formatted:', istDateUtil.format(new Date(), 'yyyy-MM-dd HH:mm:ss zzz'));

// You can also set the timezone statically
DateUtil.setTimezone('UTC');
console.log('Current Global Timezone:', istDateUtil.getTimezone()); // Will be UTC now

// file-2.ts
import { DateUtil } from '@vik/baselib/utils';

// Instantiate without a timezone; it will use the globally set timezone (e.g., 'UTC' from file-1)
const defaultDateUtil = new DateUtil();
console.log('Default Timezone Now:', defaultDateUtil.now());
console.log('Default Timezone Formatted:', defaultDateUtil.format(new Date(), 'yyyy-MM-dd HH:mm:ss zzz'));

// All other date utility methods (addDays, isFuture, startOfDay, etc.) are available as methods
const futureDate = defaultDateUtil.addDays(new Date(), 7);
console.log('Future Date (Default Timezone):', defaultDateUtil.format(futureDate));
console.log('Is Future:', defaultDateUtil.isFuture(futureDate));
```

### 11. JWT Module

A simple, high-DX utility for signing and verifying JSON Web Tokens (JWTs) using `jsonwebtoken`. It provides a stateful secret manager and an Express-ready `authMiddleware()` that auto-authorizes and attaches the verified user payload to the request.

**Features:**
-   **Singleton `jwt` object**: All JWT functionalities are exposed via a single, pre-instantiated `jwt` object.
-   **Stateful Secret Management**: The JWT secret is configured once globally using `jwt.setSecret()`. Subsequent `sign()` and `verify()` calls automatically use this stored secret.
-   **Express `authMiddleware()`**: An Express middleware that extracts the Bearer token, verifies it, and attaches the decoded payload to `req.user`. It throws `AppError` (401 Unauthorized) for missing, invalid, or expired tokens.
-   **Enhanced Error Handling**: Integrates with `@vik/baselib/errors` to throw structured `AppError` instances for JWT-related issues.

**Developer Usage:**

```ts
import { jwt, AuthenticatedRequest } from '@vik/baselib/jwt';
import { AppError, ErrorType } from '@vik/baselib/errors';
import express from 'express'; // Assuming Express is used in your project

const app = express();

// 1. Configure the JWT secret once at application startup.
jwt.setSecret(process.env.JWT_SECRET || 'your-super-secret-key');

// 2. Sign a token
const payload = { userId: '123', username: 'testuser' };
const token = jwt.sign(payload, { expiresIn: '1h' });
console.log('Signed Token:', token);

// 3. Verify a token
try {
  const decodedPayload = jwt.verify(token); // Uses the globally set secret
  console.log('Decoded Payload:', decodedPayload); // { userId: '123', username: 'testuser', iat: ..., exp: ... }

  // Example of an expired token (for testing error handling)
  // const expiredToken = jwt.sign(payload, { expiresIn: '0s' });
  // await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for token to expire
  // jwt.verify(expiredToken);

} catch (error) {
  if (error instanceof AppError) {
    console.error(`JWT Error (${error.type}): ${error.message}`);
    if (error.type === ErrorType.AUTH) {
      console.error('Authentication failed due to invalid or expired token.');
    }
  } else {
    console.error('An unexpected error occurred:', error);
  }
}

// 4. Use authMiddleware for protected routes
app.get('/secure', jwt.authMiddleware(), (req: AuthenticatedRequest, res) => {
  const user = req.user; // Payload attached to req.user
  res.send({ message: 'Access granted!', user });
});

// 5. Extract token manually
const mockRequest = { headers: { authorization: `Bearer ${token}` } } as express.Request;
const extractedToken = jwt.extract(mockRequest);
console.log('Extracted Token:', extractedToken);

// 6. Decode token without verification
const decodedWithoutVerify = jwt.decode(token);
console.log('Decoded (unverified):', decodedWithoutVerify);

// Example Express error handling middleware (from @vik/baselib/errors)
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const { statusCode, message, type } = handleError(err, { logger }); // Assuming logger is available
  res.status(statusCode).json({ message, type });
});

// Start your Express server
// app.listen(3000, () => console.log('Server running on port 3000'));
```

### 12. File Upload Utility (Cloud-Agnostic)

A unified, cloud-agnostic file upload utility supporting AWS S3, Google Cloud Storage, and Azure Blob Storage. It provides a single API for direct file uploads and generating pre-signed/SAS URLs, with flexible configuration and lazy loading of cloud adapters.

**Features:**
-   **Unified API**: `uploadFile` and `generatePresignedUrl` for all supported cloud providers.
-   **Multi-Cloud Support**: Seamlessly switch between AWS S3, Google Cloud Storage, and Azure Blob Storage.
-   **Direct Upload & Presigned URLs**: Supports both direct file uploads (via `Buffer` or `Readable` stream) and generation of secure, time-limited URLs for client-side uploads.
-   **Global Configuration**: Configure a default cloud provider and its credentials once at application startup.
-   **Lazy Loading**: Cloud-specific adapters are instantiated only when needed, optimizing resource usage.
-   **Optional File Validation**: `isRequired` option to throw `AppError` if no file is provided for upload.
-   **DX-first & Secure**: Designed for ease of use with strong typing and secure credential handling.

**Installation:**

The following dependencies are required for the respective cloud providers:
```sh
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
pnpm add @google-cloud/storage
pnpm add @azure/storage-blob
```

**Developer Usage:**

```ts
import { uploadManager, uploadFile, generatePresignedUrl } from '@vik/baselib/upload';
import { AppError } from '@vik/baselib/errors';
import { readFileSync, createReadStream } from 'fs'; // For example usage

// 1. Configure a default cloud provider and its credentials (optional, but recommended)
// This configuration will be used if `provider` or `credentials` are not specified in `uploadFile` or `generatePresignedUrl` options.
uploadManager.configure({
  defaultProvider: 'aws',
  credentials: {
    provider: 'aws',
    accessKeyId: 'YOUR_AWS_ACCESS_KEY_ID',
    secretAccessKey: 'YOUR_AWS_SECRET_ACCESS_KEY',
    region: 'YOUR_AWS_REGION',
  },
});

// Example: Configure for GCP
/*
uploadManager.configure({
  defaultProvider: 'gcp',
  credentials: {
    provider: 'gcp',
    gcpKeyFilePath: './path/to/your/gcp-key.json',
    projectId: 'your-gcp-project-id',
  },
});
*/

// Example: Configure for Azure
/*
uploadManager.configure({
  defaultProvider: 'azure',
  credentials: {
    provider: 'azure',
    azureConnectionString: 'YOUR_AZURE_STORAGE_CONNECTION_STRING',
  },
});
*/

// 2. Upload a file (using global config or specific options)

// Using global configuration (if configured)
async function uploadExample1() {
  try {
    const buffer = readFileSync('path/to/your/image.png');
    const result = await uploadFile(buffer, {
      key: 'users/profile/avatar.png',
      mimeType: 'image/png',
      bucket: 'your-default-bucket', // Optional if bucket is part of global config or inferred
      isRequired: true,
    });
    console.log('Upload successful (using global config):', result);
  } catch (error) {
    if (error instanceof AppError) {
      console.error(`Upload Error (${error.statusCode}): ${error.message}`);
    } else {
      console.error('An unexpected upload error occurred:', error);
    }
  }
}

// Overriding global configuration or specifying all options
async function uploadExample2() {
  try {
    const stream = createReadStream('path/to/your/document.pdf');
    const result = await uploadFile(stream, {
      provider: 'gcp', // Explicitly use GCP
      key: 'documents/report.pdf',
      mimeType: 'application/pdf',
      bucket: 'your-gcp-bucket',
      credentials: { // Provide GCP-specific credentials for this upload
        provider: 'gcp',
        gcpKeyFilePath: './path/to/another/gcp-key.json',
      },
    });
    console.log('Upload successful (explicit GCP config):', result);
  } catch (error) {
    if (error instanceof AppError) {
      console.error(`Upload Error (${error.statusCode}): ${error.message}`);
    } else {
      console.error('An unexpected upload error occurred:', error);
    }
  }
}

// 3. Generate a pre-signed URL (using global config or specific options)

// Using global configuration (if configured)
async function presignExample1() {
  try {
    const presigned = await generatePresignedUrl({
      key: 'videos/upload-temp.mp4',
      mimeType: 'video/mp4',
      bucket: 'your-default-bucket',
      expiresIn: 3600, // URL valid for 1 hour
    });
    console.log('Presigned URL (using global config):', presigned.url);
  } catch (error) {
    if (error instanceof AppError) {
      console.error(`Presign Error (${error.statusCode}): ${error.message}`);
    } else {
      console.error('An unexpected presign error occurred:', error);
    }
  }
}

// Overriding global configuration or specifying all options
async function presignExample2() {
  try {
    const presigned = await generatePresignedUrl({
      provider: 'azure', // Explicitly use Azure
      key: 'audios/recording.mp3',
      mimeType: 'audio/mpeg',
      bucket: 'your-azure-container',
      expiresIn: 1800, // URL valid for 30 minutes
      credentials: { // Provide Azure-specific credentials for this presign
        provider: 'azure',
        azureConnectionString: 'YOUR_AZURE_STORAGE_CONNECTION_STRING_FOR_THIS_CALL',
      },
    });
    console.log('Presigned URL (explicit Azure config):', presigned.url);
  } catch (error) {
    if (error instanceof AppError) {
      console.error(`Presign Error (${error.statusCode}): ${error.message}`);
    } else {
      console.error('An unexpected presign error occurred:', error);
    }
  }
}

// Call examples (uncomment to run)
// uploadExample1();
// uploadExample2();
// presignExample1();
// presignExample2();
```

#### API Integration Example (Express.js)

This example demonstrates how to integrate the file upload utility into an Express.js application, handling both direct file uploads via a POST endpoint and generating presigned URLs for client-side uploads.

**Dependencies for this example:**
```sh
pnpm add express multer @types/express @types/multer
```

```ts
import express from 'express';
import multer from 'multer';
import { uploadManager, uploadFile, generatePresignedUrl } from '@vik/baselib/upload';
import { AppError, handleError } from '@vik/baselib/errors';
import { logger } from '@vik/baselib/logger'; // Assuming logger is configured

const app = express();
const upload = multer({ storage: multer.memoryStorage() }); // Use memory storage for buffer access

// Configure the upload manager globally (e.g., in your app's bootstrap file)
uploadManager.configure({
  defaultProvider: 'aws',
  credentials: {
    provider: 'aws',
    accessKeyId: 'YOUR_AWS_ACCESS_KEY_ID',
    secretAccessKey: 'YOUR_AWS_SECRET_ACCESS_KEY',
    region: 'YOUR_AWS_REGION',
  },
});

// Middleware for error handling (from @vik/baselib/errors)
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const { statusCode, message, type } = handleError(err, { logger });
  res.status(statusCode).json({ message, type });
});

// Endpoint for direct file upload
app.post('/upload-direct', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('No file provided for upload.', 400);
    }

    const fileBuffer = req.file.buffer;
    const originalname = req.file.originalname;
    const mimetype = req.file.mimetype;

    // Determine file extension or use original name
    const fileExtension = originalname.split('.').pop();
    const key = `uploads/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;

    const result = await uploadFile(fileBuffer, {
      key: key,
      mimeType: mimetype,
      bucket: 'your-upload-bucket', // Use your configured bucket
      isRequired: true,
      // provider and credentials can be omitted if globally configured
    });

    res.status(200).json({
      message: 'File uploaded successfully!',
      url: result.url,
      key: result.key,
      provider: result.provider,
    });
  } catch (error) {
    next(error); // Pass error to centralized error handler
  }
});

// Endpoint to generate a presigned URL for client-side upload
app.post('/generate-presigned-url', async (req, res, next) => {
  try {
    const { filename, mimeType, bucket } = req.body; // Client sends desired filename, mimeType, bucket

    if (!filename || !mimeType || !bucket) {
      throw new AppError('Filename, mimeType, and bucket are required.', 400);
    }

    const key = `uploads/${Date.now()}-${Math.random().toString(36).substring(7)}-${filename}`;

    const presigned = await generatePresignedUrl({
      key: key,
      mimeType: mimeType,
      bucket: bucket,
      expiresIn: 3600, // URL valid for 1 hour
      // provider and credentials can be omitted if globally configured
    });

    res.status(200).json({
      message: 'Presigned URL generated successfully!',
      url: presigned.url,
      fields: presigned.fields, // For S3 POST presigned URLs
      key: key,
    });
  } catch (error) {
    next(error); // Pass error to centralized error handler
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  console.log(`Server running on http://localhost:${PORT}`);
});
```

### 13. Lodash Utilities (`_` Object)

The `@vik/baselib/utils` module now integrates the full [Lodash](https://lodash.com/) library, exposed via a single `_` object. This provides a comprehensive set of high-performance utility functions for common programming tasks, replicating the familiar Lodash developer experience.

Additionally, the `_` object can be extended with custom, project-specific helpers directly within `src/utils/_utils.ts`.

**Custom Extensions Included:**

*   `_.sleep(ms: number)`: Returns a Promise that resolves after `ms` milliseconds.
*   `_.uuid()`: Generates a UUID (uses `crypto.randomUUID` if available, falls back to a less secure method).
*   `_.retry<T>(fn: () => Promise<T>, times: number, delay?: number)`: Retries an async function `fn` a specified number of `times` with an optional `delay` between retries.

**Developer Usage:**

```ts
import { _ } from '@vik/baselib/utils';

// Use any standard Lodash function
const user = { id: 1, name: 'Alice', email: 'alice@example.com' };
const pickedUser = _.pick(user, ['id', 'name']);
console.log('Picked User:', pickedUser); // { id: 1, name: 'Alice' }

console.log('Is Empty Array:', _.isEmpty([])); // true
console.log('Unique Array:', _.uniq([1, 2, 2, 3])); // [1, 2, 3]

// Use custom extended functions
console.log('Generated UUID:', _.uuid());

async function fetchData() {
  console.log('Attempting to fetch data...');
  // Simulate a flaky API call
  if (Math.random() > 0.5) {
    throw new Error('Network error');
  }
  return 'Data fetched successfully!';
}

(async () => {
  try {
    const result = await _.retry(fetchData, 3, 100);
    console.log('Retry Result:', result);
  } catch (error: any) {
    console.error('Retry Failed:', error.message);
  }
})();

// Example of using sleep
(async () => {
  console.log('Waiting for 1 second...');
  await _.sleep(1000);
  console.log('1 second passed!');
})();
```

---

## 🧪 Testing & Coverage

All core modules (config, logger, mongo, redis, queue, postgres, email) have robust, isolated unit tests with mocks for all external dependencies. No real services are required.

**Run all unit tests:**
```sh
pnpm test
```

**Check coverage:**
```sh
pnpm test:coverage
```

- All modules are covered: config, logger, mongo, redis, queue, postgres, email
- Edge cases and error handling are tested
- No integration tests or real service dependencies

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
