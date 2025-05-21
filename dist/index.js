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
  createModel: () => createModel
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BaseRepository,
  MongoManager,
  createModel
});
