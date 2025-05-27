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

Category	Module	Description
Core	Config, Logger, Errors, Validator	App-wide utilities
Databases	MongoDB, Postgres	Schema + Repo pattern, multi-connection
Infra	Redis, Queue	Cache, pub/sub, BullMQ jobs
Auth	JWT	Stateless auth + middleware
Integration	Email, File Upload	SendGrid, SMTP, S3/GCP/Azure uploader
Utilities	DateUtil, Lodash _	Timezone dates, deep utils


⸻

🔧 Core Modules

✅ Config

import { config } from '@vik/baselib';
config.get('DATABASE_URL');
config.getOptional('REDIS_HOST');
config.getOrDefault('PORT', '3000');

✅ Logger

import { logger } from '@vik/baselib/logger';
logger.info('Server started');
logger.child({ module: 'auth' }).warn('Login failed');

✅ Error Handling

import { AppError, handleError } from '@vik/baselib/errors';
throw new AppError('Invalid input', 400, 'VALIDATION');

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

import { connectPostgres, createRepository } from '@vik/baselib/postgres';
connectPostgres('main', {...});
const users = pgTable('users', {...});
const repo = createRepository(users, 'main');


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

🧱 Lodash (_)

import { _ } from '@vik/baselib/utils';
_.pick(user, ['id', 'email']);
_.uuid(); _.sleep(1000);


⸻

🧪 Testing

pnpm test          # run all tests
pnpm test:coverage # check coverage

	•	Pure unit tests, no real service dependencies
	•	Mocks for Redis, DB, JWT, etc.

⸻

📦 Build & Release

pnpm build     # compile everything
pnpm push      # push full source to main branch
pnpm release   # push compiled dist to release branch


⸻

💡 Philosophy
	•	Modular, decoupled, lazy-loaded
	•	Plug-and-play DX: one import to get going
	•	Minimal external config — conventions over config
	•	Team-ready, with no setup required

⸻

🤝 Contributing

Private internal library. Contact Vikash for access or extension guidelines.

⸻

📄 License

MIT