var __defProp = Object.defineProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/mongo/mongo.manager.ts
import mongoose from "mongoose";
var MongoManager = class _MongoManager {
  constructor() {
    this.connections = /* @__PURE__ */ new Map();
  }
  static getInstance() {
    if (!_MongoManager.instance) {
      _MongoManager.instance = new _MongoManager();
    }
    return _MongoManager.instance;
  }
  async connect(connectionName, uri) {
    if (this.connections.has(connectionName)) {
      console.warn(`Connection '${connectionName}' already exists. Returning existing connection.`);
      return this.connections.get(connectionName);
    }
    try {
      const connection = await mongoose.createConnection(uri).asPromise();
      this.connections.set(connectionName, connection);
      console.log(`MongoDB connection '${connectionName}' established successfully.`);
      connection.on("error", (err) => {
        console.error(`MongoDB connection '${connectionName}' error:`, err);
      });
      connection.on("disconnected", () => {
        console.warn(`MongoDB connection '${connectionName}' disconnected.`);
        this.connections.delete(connectionName);
      });
      return connection;
    } catch (error) {
      console.error(`Failed to establish MongoDB connection '${connectionName}':`, error);
      throw error;
    }
  }
  getConnection(connectionName) {
    const connection = this.connections.get(connectionName);
    if (!connection) {
      throw new Error(`Connection '${connectionName}' not found. Please connect first.`);
    }
    return connection;
  }
  async disconnect(connectionName) {
    if (connectionName) {
      const connection = this.connections.get(connectionName);
      if (connection) {
        await connection.close();
        this.connections.delete(connectionName);
        console.log(`MongoDB connection '${connectionName}' disconnected.`);
      } else {
        console.warn(`Connection '${connectionName}' not found for disconnection.`);
      }
    } else {
      for (const [name, connection] of this.connections.entries()) {
        await connection.close();
        console.log(`MongoDB connection '${name}' disconnected.`);
      }
      this.connections.clear();
    }
  }
};
var mongo_manager_default = MongoManager;

// src/mongo/model.factory.ts
import { Schema } from "mongoose";
function createModel(name, schemaDef, connectionName) {
  const mongoManager = mongo_manager_default.getInstance();
  const connection = mongoManager.getConnection(connectionName);
  const schema = new Schema(schemaDef, { timestamps: true });
  if (connection.models[name]) {
    return connection.models[name];
  }
  return connection.model(name, schema);
}

// src/mongo/base.repository.ts
var BaseRepository = class {
  constructor(model) {
    this.model = model;
  }
  async findAll(filter = {}) {
    return this.model.find(filter).exec();
  }
  async findById(id) {
    return this.model.findById(id).exec();
  }
  async create(data) {
    const doc = new this.model(data);
    return doc.save();
  }
  async update(id, data) {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }
  async delete(id) {
    return this.model.findByIdAndDelete(id).exec();
  }
};

// src/redis/redis.manager.ts
import Redis from "ioredis";
var RedisManager = class _RedisManager {
  constructor() {
    this.clients = /* @__PURE__ */ new Map();
  }
  static getInstance() {
    if (!_RedisManager.instance) {
      _RedisManager.instance = new _RedisManager();
    }
    return _RedisManager.instance;
  }
  connectRedis(name, options) {
    if (this.clients.has(name)) {
      console.warn(`Redis client '${name}' already exists. Returning existing client.`);
      return this.clients.get(name);
    }
    const client = new Redis(options);
    client.on("connect", () => {
      console.log(`Redis client '${name}' connected successfully.`);
    });
    client.on("error", (err) => {
      console.error(`Redis client '${name}' connection error:`, err);
    });
    client.on("end", () => {
      console.log(`Redis client '${name}' disconnected.`);
      this.clients.delete(name);
    });
    this.clients.set(name, client);
    return client;
  }
  getRedis(name) {
    const client = this.clients.get(name);
    if (!client) {
      throw new Error(`Redis client '${name}' not found. Please connect first.`);
    }
    return client;
  }
  async disconnectRedis(name) {
    if (name) {
      const client = this.clients.get(name);
      if (client) {
        await client.quit();
        this.clients.delete(name);
        console.log(`Redis client '${name}' explicitly quit.`);
      } else {
        console.warn(`Redis client '${name}' not found for disconnection.`);
      }
    } else {
      for (const [clientName, client] of this.clients.entries()) {
        await client.quit();
        console.log(`Redis client '${clientName}' explicitly quit.`);
      }
      this.clients.clear();
    }
  }
};
var redisManager = RedisManager.getInstance();
var connectRedis = (name, options) => {
  return redisManager.connectRedis(name, options);
};
var getRedis = (name) => {
  return redisManager.getRedis(name);
};
var disconnectAllRedis = async () => {
  await redisManager.disconnectRedis();
};
var disconnectSpecificRedis = async (name) => {
  await redisManager.disconnectRedis(name);
};

// src/redis/cache.util.ts
async function cacheSet(key, value, ttlSeconds, redisName = "default") {
  const redis = getRedis(redisName);
  await redis.setex(key, ttlSeconds, JSON.stringify(value));
}
async function cacheGet(key, redisName = "default") {
  const redis = getRedis(redisName);
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}
async function cacheDel(key, redisName = "default") {
  const redis = getRedis(redisName);
  return redis.del(key);
}

// src/redis/pubsub.util.ts
var subscriberClients = /* @__PURE__ */ new Map();
function subscribe(channel, onMessage, redisName = "default") {
  let subscriber = subscriberClients.get(redisName);
  if (!subscriber) {
    subscriber = getRedis(redisName).duplicate();
    subscriberClients.set(redisName, subscriber);
    subscriber.on("message", (ch, msg) => {
      if (ch === channel) {
        onMessage(msg);
      }
    });
  }
  subscriber.subscribe(channel);
}
async function publish(channel, message, redisName = "default") {
  const publisher = getRedis(redisName);
  return publisher.publish(channel, message);
}

// src/queue/queue.manager.ts
import { Queue } from "bullmq";
var queues = /* @__PURE__ */ new Map();
function createQueue(name, redisName = "default", config2) {
  if (queues.has(name)) {
    return queues.get(name);
  }
  const connection = getRedis(redisName);
  const queue = new Queue(name, { connection, ...config2 });
  queues.set(name, queue);
  return queue;
}
function getQueue(name) {
  const queue = queues.get(name);
  if (!queue) {
    throw new Error(`Queue with name "${name}" not found. Please create it first.`);
  }
  return queue;
}

// src/queue/queue.worker.ts
import { Worker } from "bullmq";
var workers = /* @__PURE__ */ new Map();
function createWorker(queueName, processor, redisName = "default", opts) {
  if (workers.has(queueName)) {
    return workers.get(queueName);
  }
  const connection = getRedis(redisName);
  const worker = new Worker(queueName, processor, { connection, ...opts });
  workers.set(queueName, worker);
  worker.on("completed", (job) => {
    console.log(`Job ${job.id} in queue ${queueName} completed.`);
  });
  worker.on("failed", (job, err) => {
    console.error(`Job ${job == null ? void 0 : job.id} in queue ${queueName} failed with error: ${err.message}`);
  });
  return worker;
}

// src/postgres/postgres.manager.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
var pools = /* @__PURE__ */ new Map();
var drizzleClients = /* @__PURE__ */ new Map();
function connectPostgres(name, config2) {
  if (pools.has(name)) return;
  const pool = new Pool(config2);
  pools.set(name, pool);
  const client = drizzle(pool);
  drizzleClients.set(name, client);
}
function getDrizzleClient(name) {
  const client = drizzleClients.get(name);
  if (!client) throw new Error(`Drizzle client for '${name}' not found. Did you call connectPostgres?`);
  return client;
}

// src/postgres/repo.factory.ts
function createRepository(table, dbName = "main", primaryKey = "id") {
  const db = getDrizzleClient(dbName);
  return {
    db,
    // raw access
    insert: async (data) => {
      await db.insert(table).values(data).returning();
    },
    findAll: async () => {
      return await db.select().from(table);
    },
    findById: async (id) => {
      const rows = await db.select().from(table).where(table[primaryKey].eq(id));
      return rows[0];
    },
    delete: async (id) => {
      await db.delete(table).where(table[primaryKey].eq(id)).returning();
    }
  };
}

// src/config/config.manager.ts
var dotenvLoaded = false;
function ensureDotenvLoaded() {
  if (!dotenvLoaded) {
    __require("dotenv").config();
    dotenvLoaded = true;
  }
}
var config = {
  /**
   * Get a required environment variable. Throws if missing.
   * @param key The environment variable key
   * @returns The value
   * @throws If the variable is missing
   */
  get(key) {
    ensureDotenvLoaded();
    const value = process.env[key];
    if (value === void 0) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
  },
  /**
   * Get an optional environment variable. Returns undefined if missing.
   * @param key The environment variable key
   * @returns The value or undefined
   */
  getOptional(key) {
    ensureDotenvLoaded();
    return process.env[key];
  },
  /**
   * Get an environment variable or a fallback value if missing.
   * @param key The environment variable key
   * @param fallback The fallback value
   * @returns The value or fallback
   */
  getOrDefault(key, fallback) {
    var _a;
    ensureDotenvLoaded();
    return (_a = process.env[key]) != null ? _a : fallback;
  },
  /**
   * Validate that all given keys are present. Throws if any are missing.
   * @param keys The required keys
   * @throws If any are missing
   */
  validate(keys) {
    ensureDotenvLoaded();
    const missing = keys.filter((k) => process.env[k] === void 0);
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
    }
  },
  /**
   * Validate environment using a Zod schema. Throws if invalid.
   * @param schema The Zod schema
   * @returns The validated result
   * @throws If validation fails
   */
  validateWithSchema(schema) {
    ensureDotenvLoaded();
    return schema.parse(process.env);
  }
};

// src/email/providers/sendgrid.provider.ts
import sgMail from "@sendgrid/mail";
var SendGridProvider = class {
  constructor(options) {
    this.options = options;
    sgMail.setApiKey(options.apiKey);
    this.from = options.from;
  }
  async sendEmail(options) {
    try {
      const msg = {
        to: options.to,
        from: options.from || this.from,
        subject: options.subject,
        text: options.text,
        html: options.html,
        cc: options.cc,
        bcc: options.bcc,
        attachments: options.attachments
      };
      const [response] = await sgMail.send(msg);
      const messageId = response.headers["x-message-id"] || response.headers["X-Message-Id"];
      return { success: true, messageId };
    } catch (error) {
      return { success: false, error };
    }
  }
};

// src/email/providers/smtp.provider.ts
import nodemailer from "nodemailer";
var SmtpProvider = class {
  constructor(options) {
    var _a;
    this.transporter = nodemailer.createTransport({
      host: options.host,
      port: options.port,
      secure: (_a = options.secure) != null ? _a : false,
      auth: options.auth
    });
    this.defaultFrom = options.from;
  }
  async sendEmail(options) {
    try {
      const info = await this.transporter.sendMail({
        from: options.from || this.defaultFrom,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        cc: options.cc,
        bcc: options.bcc,
        attachments: options.attachments
      });
      return { success: true, messageId: info.messageId };
    } catch (error) {
      return { success: false, error };
    }
  }
};

// src/email/email.manager.ts
var provider = null;
var secondaryProvider = null;
var email = {
  setProvider(p) {
    provider = p;
  },
  setSecondaryProvider(p) {
    secondaryProvider = p;
  },
  setDefaultSendGrid(options) {
    provider = new SendGridProvider(options);
  },
  setSecondarySmtp(options) {
    secondaryProvider = new SmtpProvider(options);
  },
  async sendEmail(options) {
    if (!provider) {
      throw new Error("No email provider set. Call email.setProvider(...) or email.setDefaultSendGrid(...) first.");
    }
    try {
      return await provider.sendEmail(options);
    } catch (err) {
      if (secondaryProvider) {
        return secondaryProvider.sendEmail(options);
      }
      throw err;
    }
  }
};

// src/logger/index.ts
var logger_exports = {};
__export(logger_exports, {
  logger: () => logger
});

// src/logger/logger.manager.ts
import pino from "pino";
var instance = null;
function createLogger(context = {}, parent) {
  const isDev = process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "prod";
  const options = {
    level: process.env.LOG_LEVEL || "info",
    timestamp: pino.stdTimeFunctions.isoTime,
    ...isDev ? { transport: { target: "pino-pretty", options: { colorize: true, translateTime: "SYS:standard" } } } : {},
    base: void 0
    // don't include pid, hostname by default
  };
  const logger2 = parent ? parent.child(context) : pino(options).child(context);
  const api = {
    info: (msg, meta) => logger2.info(meta || {}, msg),
    error: (msg, meta) => logger2.error(meta || {}, msg),
    warn: (msg, meta) => logger2.warn(meta || {}, msg),
    debug: (msg, meta) => logger2.debug(meta || {}, msg),
    child: (childContext) => createLogger(childContext, logger2),
    _pino: logger2
  };
  return api;
}
function getLogger() {
  if (!instance) {
    instance = createLogger();
  }
  return instance;
}
var logger = getLogger();

// src/errors/index.ts
var errors_exports = {};
__export(errors_exports, {
  AppError: () => AppError,
  ErrorType: () => ErrorType,
  handleError: () => handleError
});

// src/errors/error.types.ts
var ErrorType = /* @__PURE__ */ ((ErrorType2) => {
  ErrorType2["VALIDATION"] = "VALIDATION";
  ErrorType2["AUTH"] = "AUTH";
  ErrorType2["NOT_FOUND"] = "NOT_FOUND";
  ErrorType2["INTERNAL"] = "INTERNAL";
  return ErrorType2;
})(ErrorType || {});

// src/errors/app-error.ts
var AppError = class extends Error {
  constructor(message, statusCode = 500, type = "INTERNAL" /* INTERNAL */, context) {
    var _a;
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.type = type;
    this.context = context;
    this.isOperational = true;
    (_a = Error.captureStackTrace) == null ? void 0 : _a.call(Error, this, this.constructor);
  }
};

// src/errors/error.handler.ts
function handleError(error, options = {}) {
  let appError;
  if (error instanceof AppError) {
    appError = error;
  } else if (error instanceof Error) {
    appError = new AppError(error.message, 500, "INTERNAL" /* INTERNAL */);
  } else {
    appError = new AppError("Unknown error", 500, "INTERNAL" /* INTERNAL */);
  }
  if (options.logger) {
    options.logger.error(appError.message, {
      type: appError.type,
      statusCode: appError.statusCode,
      context: appError.context,
      stack: appError.stack,
      traceId: options.traceId
    });
  }
  return {
    statusCode: appError.statusCode,
    message: appError.message,
    type: appError.type,
    traceId: options.traceId
  };
}

// src/validator/v.ts
import { z } from "zod";
var v = Object.assign(z, {
  validate(schemaObject, data) {
    const schema = z.object(schemaObject);
    const result = schema.safeParse(data);
    if (!result.success) {
      throw new AppError("Validation failed", 400, "VALIDATION", result.error.flatten());
    }
    return result.data;
  }
});
var v_default = v;

// src/validator/validator.ts
function validate(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new AppError("Validation failed", 400, "VALIDATION", result.error.flatten());
  }
  return result.data;
}

// src/utils/object.utils.ts
var object_utils_exports = {};
__export(object_utils_exports, {
  deepClone: () => deepClone,
  omit: () => omit,
  pick: () => pick
});
function pick(obj, keys) {
  const result = {};
  for (const key of keys) {
    if (key in obj) result[key] = obj[key];
  }
  return result;
}
function omit(obj, keys) {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// src/utils/string.utils.ts
var string_utils_exports = {};
__export(string_utils_exports, {
  capitalize: () => capitalize,
  slugify: () => slugify,
  truncate: () => truncate
});
function slugify(input) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
function truncate(str, length) {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

// src/utils/date.utils.ts
var date_utils_exports = {};
__export(date_utils_exports, {
  addDays: () => addDays,
  addHours: () => addHours,
  addMinutes: () => addMinutes,
  compareDates: () => compareDates,
  daysBetween: () => daysBetween,
  endOfDay: () => endOfDay,
  formatDate: () => formatDate,
  fromUnix: () => fromUnix,
  isFuture: () => isFuture,
  isLeapYear: () => isLeapYear,
  isPast: () => isPast,
  isSameDay: () => isSameDay,
  isToday: () => isToday,
  now: () => now,
  startOfDay: () => startOfDay,
  subDays: () => subDays,
  subHours: () => subHours,
  subMinutes: () => subMinutes,
  toUnix: () => toUnix
});
function now() {
  return /* @__PURE__ */ new Date();
}
function formatDate(date, format) {
  if (!format) return date.toISOString();
  if (format === "YYYY-MM-DD") {
    return date.toISOString().slice(0, 10);
  }
  return date.toISOString();
}
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function subDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}
function addHours(date, hours) {
  const d = new Date(date);
  d.setHours(d.getHours() + hours);
  return d;
}
function subHours(date, hours) {
  const d = new Date(date);
  d.setHours(d.getHours() - hours);
  return d;
}
function addMinutes(date, minutes) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() + minutes);
  return d;
}
function subMinutes(date, minutes) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - minutes);
  return d;
}
function isFuture(date) {
  return date.getTime() > Date.now();
}
function isPast(date) {
  return date.getTime() < Date.now();
}
function isToday(date) {
  const today = /* @__PURE__ */ new Date();
  return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
}
function isSameDay(a, b) {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}
function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}
function compareDates(a, b) {
  return a.getTime() - b.getTime();
}
function daysBetween(a, b) {
  const diff = Math.abs(startOfDay(a).getTime() - startOfDay(b).getTime());
  return Math.floor(diff / (1e3 * 60 * 60 * 24));
}
function toUnix(date) {
  return Math.floor(date.getTime() / 1e3);
}
function fromUnix(unix) {
  return new Date(unix * 1e3);
}
function isLeapYear(date) {
  const year = date.getFullYear();
  return year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
}

// src/utils/type.utils.ts
var type_utils_exports = {};
__export(type_utils_exports, {
  isEmail: () => isEmail,
  isEmpty: () => isEmpty,
  isObject: () => isObject
});
function isObject(input) {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}
function isEmpty(input) {
  if (input == null) return true;
  if (typeof input === "string" || Array.isArray(input)) return input.length === 0;
  if (isObject(input)) return Object.keys(input).length === 0;
  return false;
}
function isEmail(input) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input);
}

// src/utils/general.utils.ts
var general_utils_exports = {};
__export(general_utils_exports, {
  retry: () => retry,
  sleep: () => sleep,
  uuid: () => uuid
});
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function retry(fn, times, delay = 0) {
  let lastErr;
  for (let i = 0; i < times; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (delay) await sleep(delay);
    }
  }
  throw lastErr;
}
function uuid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0, v2 = c === "x" ? r : r & 3 | 8;
    return v2.toString(16);
  });
}

// src/utils/index.ts
var utils = {
  ...object_utils_exports,
  ...string_utils_exports,
  ...date_utils_exports,
  ...type_utils_exports,
  ...general_utils_exports
};
export {
  BaseRepository,
  mongo_manager_default as MongoManager,
  SendGridProvider,
  SmtpProvider,
  cacheDel,
  cacheGet,
  cacheSet,
  config,
  connectPostgres,
  connectRedis,
  createModel,
  createQueue,
  createRepository,
  createWorker,
  date_utils_exports as dateUtils,
  disconnectAllRedis,
  disconnectSpecificRedis,
  email,
  errors_exports as errors,
  general_utils_exports as generalUtils,
  getDrizzleClient,
  getQueue,
  getRedis,
  logger_exports as logger,
  object_utils_exports as objectUtils,
  publish,
  string_utils_exports as stringUtils,
  subscribe,
  type_utils_exports as typeUtils,
  utils,
  v_default as v,
  validate
};
