import { Queue } from 'bullmq';
import { getRedis } from '../redis/redis.manager';
import { QueueConfig } from './types';

const queues = new Map<string, Queue>();

/**
 * Creates and registers a new BullMQ queue or returns an existing one.
 * @param name The name of the queue.
 * @param redisName Optional name of the Redis client to use. Defaults to 'default'.
 * @param config Optional BullMQ queue configuration.
 * @returns The BullMQ Queue instance.
 */
export function createQueue<T = any>(
  name: string,
  redisName: string = 'default',
  config?: QueueConfig
): Queue<T> {
  if (queues.has(name)) {
    return queues.get(name) as Queue<T>;
  }

  const connection = getRedis(redisName);
  const queue = new Queue<T>(name, { connection, ...config });
  queues.set(name, queue);
  return queue;
}

/**
 * Retrieves an existing BullMQ queue by name.
 * @param name The name of the queue to retrieve.
 * @returns The BullMQ Queue instance, or throws an error if not found.
 */
export function getQueue<T = any>(name: string): Queue<T> {
  const queue = queues.get(name);
  if (!queue) {
    throw new Error(`Queue with name "${name}" not found. Please create it first.`);
  }
  return queue as Queue<T>;
}
