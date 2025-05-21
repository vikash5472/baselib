import { JobsOptions as BullMQJobOptions, QueueOptions as BullMQQueueOptions } from 'bullmq';

/**
 * Base interface for job data, allowing for extension.
 */
export interface BaseJobData {
  [key: string]: any;
}

/**
 * Options for adding a job to a queue.
 * Extends BullMQ's JobOptions for full compatibility.
 */
export interface JobOptions extends BullMQJobOptions {}

/**
 * Configuration options for a BullMQ queue.
 * Extends BullMQ's QueueOptions for full compatibility.
 */
export interface QueueConfig extends BullMQQueueOptions {}
