import { Worker, Processor, WorkerOptions as BullMQWorkerOptions } from 'bullmq';
import { getRedis } from '../redis/redis.manager';
import { JobOptions } from './types'; // Keep JobOptions for job-specific settings if needed

const workers = new Map<string, Worker>();

/**
 * Creates and registers a new BullMQ worker for a given queue.
 * @param queueName The name of the queue the worker will process.
 * @param processor The job processor function.
 * @param redisName Optional name of the Redis client to use. Defaults to 'default'.
 * @param opts Optional BullMQ worker options.
 * @returns The BullMQ Worker instance.
 */
export function createWorker<T = any>(
  queueName: string,
  processor: Processor<T>,
  redisName: string = 'default',
  opts?: BullMQWorkerOptions // Correctly use BullMQWorkerOptions
): Worker<T> {
  if (workers.has(queueName)) {
    return workers.get(queueName) as Worker<T>;
  }

  const connection = getRedis(redisName);
  const worker = new Worker<T>(queueName, processor, { connection, ...opts });
  workers.set(queueName, worker);

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} in queue ${queueName} completed.`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} in queue ${queueName} failed with error: ${err.message}`);
  });

  return worker;
}
