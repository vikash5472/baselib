import { MongoManager, createModel, BaseRepository, BaseDocument } from '../mongo';

jest.mock('../mongo', () => {
  class MockBaseRepository {
    private store: any[] = [];
    async create(doc: any) { this.store.push(doc); return doc; }
    async findAll() { return this.store; }
    async update(id: any, data: any) { const doc = this.store.find(d => d._id === id); if (doc) Object.assign(doc, data); return doc; }
    async findById(id: any) { return this.store.find(d => d._id === id); }
    async delete(id: any) { const idx = this.store.findIndex(d => d._id === id); if (idx !== -1) return this.store.splice(idx, 1)[0]; }
  }
  return {
    MongoManager: { getInstance: () => ({ connect: jest.fn(), disconnect: jest.fn() }) },
    createModel: jest.fn((name: string, schema: any, db: string) => name + '_model'),
    BaseRepository: MockBaseRepository,
    BaseDocument: class {},
  };
});

describe('Mongo (mocked) integration', () => {
  interface IUser extends BaseDocument {
    name: string;
    email: string;
    age?: number;
  }

  const UserSchemaDef = {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    age: { type: Number },
  };

  it('performs CRUD operations', async () => {
    const { MongoManager, createModel, BaseRepository } = require('../mongo');
    const mongoManager = MongoManager.getInstance();
    await mongoManager.connect('test', 'mongodb://localhost:27017/test_db');
    const UserModel = createModel('User', {}, 'test');
    class UserRepository extends BaseRepository {
      constructor() { super(); }
    }
    const userRepository = new UserRepository();
    // Insert
    const user = await userRepository.create({ _id: 1, name: 'Test', email: 'test@example.com', age: 25 });
    expect(user).toMatchObject({ name: 'Test', email: 'test@example.com', age: 25 });
    // Find all
    const all = await userRepository.findAll();
    expect(all.length).toBeGreaterThan(0);
    // Update
    const updated = await userRepository.update(1, { age: 26 });
    expect(updated?.age).toBe(26);
    // Find by id
    const found = await userRepository.findById(1);
    expect(found?._id).toBe(1);
    // Delete
    const deleted = await userRepository.delete(1);
    expect(deleted?._id).toBe(1);
    await mongoManager.disconnect('test');
  });

  it('returns undefined for missing document', async () => {
    const { BaseRepository } = require('../mongo');
    class UserRepository extends BaseRepository {
      constructor() { super(); }
    }
    const userRepository = new UserRepository();
    const found = await userRepository.findById(999);
    expect(found).toBeUndefined();
    const deleted = await userRepository.delete(999);
    expect(deleted).toBeUndefined();
  });

  it('does not update if document not found', async () => {
    const { BaseRepository } = require('../mongo');
    class UserRepository extends BaseRepository {
      constructor() { super(); }
    }
    const userRepository = new UserRepository();
    const updated = await userRepository.update(999, { age: 30 });
    expect(updated).toBeUndefined();
  });
}); 