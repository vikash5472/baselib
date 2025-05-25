import { MongoManager, createModel, BaseRepository, BaseDocument } from '../mongo';

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

async function runMongoTest() {
  const mongoManager = MongoManager.getInstance();
  await mongoManager.connect('test', 'mongodb://localhost:27017/test_db');
  const UserModel = createModel<IUser>('User', UserSchemaDef, 'test');
  class UserRepository extends BaseRepository<IUser> {
    constructor() { super(UserModel); }
  }
  const userRepository = new UserRepository();

  // Insert
  const user = await userRepository.create({ name: 'Test', email: 'test@example.com', age: 25 } as IUser);
  console.log('Inserted:', user);

  // Find all
  const all = await userRepository.findAll();
  console.log('All:', all);

  // Update
  const updated = await userRepository.update(user._id, { age: 26 });
  console.log('Updated:', updated);

  // Find by id
  const found = await userRepository.findById(user._id);
  console.log('Found by id:', found);

  // Delete
  const deleted = await userRepository.delete(user._id);
  console.log('Deleted:', deleted);

  await mongoManager.disconnect('test');
}

runMongoTest().catch(console.error); 