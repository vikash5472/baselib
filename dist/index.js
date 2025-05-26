"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  BaseRepository: () => BaseRepository,
  MongoManager: () => mongo_manager_default,
  SendGridProvider: () => SendGridProvider,
  SmtpProvider: () => SmtpProvider,
  cacheDel: () => cacheDel,
  cacheGet: () => cacheGet,
  cacheSet: () => cacheSet,
  config: () => config,
  connectPostgres: () => connectPostgres,
  connectRedis: () => connectRedis,
  createModel: () => createModel,
  createQueue: () => createQueue,
  createRepository: () => createRepository,
  createWorker: () => createWorker,
  disconnectAllRedis: () => disconnectAllRedis,
  disconnectSpecificRedis: () => disconnectSpecificRedis,
  email: () => email,
  errors: () => errors_exports,
  getDrizzleClient: () => getDrizzleClient,
  getQueue: () => getQueue,
  getRedis: () => getRedis,
  logger: () => logger_exports,
  publish: () => publish,
  subscribe: () => subscribe
});
module.exports = __toCommonJS(index_exports);

// src/mongo/mongo.manager.ts
var import_mongoose = __toESM(require("mongoose"));
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
      const connection = await import_mongoose.default.createConnection(uri).asPromise();
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
var import_mongoose2 = require("mongoose");
function createModel(name, schemaDef, connectionName) {
  const mongoManager = mongo_manager_default.getInstance();
  const connection = mongoManager.getConnection(connectionName);
  const schema = new import_mongoose2.Schema(schemaDef, { timestamps: true });
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
var import_ioredis = __toESM(require("ioredis"));
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
    const client = new import_ioredis.default(options);
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
var import_bullmq = require("bullmq");
var queues = /* @__PURE__ */ new Map();
function createQueue(name, redisName = "default", config2) {
  if (queues.has(name)) {
    return queues.get(name);
  }
  const connection = getRedis(redisName);
  const queue = new import_bullmq.Queue(name, { connection, ...config2 });
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
var import_bullmq2 = require("bullmq");
var workers = /* @__PURE__ */ new Map();
function createWorker(queueName, processor, redisName = "default", opts) {
  if (workers.has(queueName)) {
    return workers.get(queueName);
  }
  const connection = getRedis(redisName);
  const worker = new import_bullmq2.Worker(queueName, processor, { connection, ...opts });
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
var import_node_postgres = require("drizzle-orm/node-postgres");
var import_pg = require("pg");
var pools = /* @__PURE__ */ new Map();
var drizzleClients = /* @__PURE__ */ new Map();
function connectPostgres(name, config2) {
  if (pools.has(name)) return;
  const pool = new import_pg.Pool(config2);
  pools.set(name, pool);
  const client = (0, import_node_postgres.drizzle)(pool);
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
    require("dotenv").config();
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
var import_mail = __toESM(require("@sendgrid/mail"));
var SendGridProvider = class {
  constructor(options) {
    this.options = options;
    import_mail.default.setApiKey(options.apiKey);
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
      const [response] = await import_mail.default.send(msg);
      const messageId = response.headers["x-message-id"] || response.headers["X-Message-Id"];
      return { success: true, messageId };
    } catch (error) {
      return { success: false, error };
    }
  }
};

// src/email/providers/smtp.provider.ts
var import_nodemailer = __toESM(require("nodemailer"));
var SmtpProvider = class {
  constructor(options) {
    var _a;
    this.transporter = import_nodemailer.default.createTransport({
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
var import_pino = __toESM(require("pino"));
var instance = null;
function createLogger(context = {}, parent) {
  const isDev = process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "prod";
  const options = {
    level: process.env.LOG_LEVEL || "info",
    timestamp: import_pino.default.stdTimeFunctions.isoTime,
    ...isDev ? { transport: { target: "pino-pretty", options: { colorize: true, translateTime: "SYS:standard" } } } : {},
    base: void 0
    // don't include pid, hostname by default
  };
  const logger2 = parent ? parent.child(context) : (0, import_pino.default)(options).child(context);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BaseRepository,
  MongoManager,
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
  disconnectAllRedis,
  disconnectSpecificRedis,
  email,
  errors,
  getDrizzleClient,
  getQueue,
  getRedis,
  logger,
  publish,
  subscribe
});
