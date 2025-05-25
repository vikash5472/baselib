import { connectRedis } from '../redis';
import { createQueue, createWorker } from '../queue';

async function runQueueTest() {
  connectRedis('jobs', { host: 'localhost', port: 6379 });
  const queue = createQueue('test-queue', 'jobs');

  // Worker
  createWorker('test-queue', async (job) => {
    console.log('Worker got job:', job.data);
  });

  // Add job
  await queue.add('testJob', { foo: 'bar' });
  console.log('Job added');

  // Wait a moment for job to be processed
  setTimeout(() => process.exit(0), 2000);
}

runQueueTest().catch(console.error); 