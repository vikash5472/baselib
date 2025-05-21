import { FilterQuery, UpdateQuery } from 'mongoose';
import { MongooseModel, BaseDocument } from './types';

export class BaseRepository<T extends BaseDocument> {
  protected model: MongooseModel<T>;

  constructor(model: MongooseModel<T>) {
    this.model = model;
  }

  public async findAll(filter: FilterQuery<T> = {}): Promise<T[]> {
    return this.model.find(filter).exec();
  }

  public async findById(id: string): Promise<T | null> {
    return this.model.findById(id).exec();
  }

  public async create(data: Partial<T>): Promise<T> {
    const doc = new this.model(data);
    return doc.save();
  }

  public async update(id: string, data: UpdateQuery<T>): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  public async delete(id: string): Promise<T | null> {
    return this.model.findByIdAndDelete(id).exec();
  }
}
