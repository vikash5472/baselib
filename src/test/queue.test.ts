import { connectRedis } from '../redis';
import { createQueue, createWorker } from '../queue';

jest.mock('../redis', () => ({
  connectRedis: jest.fn(),
}));

jest.mock('../queue', () => {
  let workerCallback: ((job: any) => void) | null = null;
  return {
    createQueue: jest.fn(() => ({
      add: jest.fn((name: string, data: any) => {
        // Immediately trigger the worker callback
        if (workerCallback) workerCallback({ data });
      }),
    })),
    createWorker: jest.fn((queueName: string, cb: (job: any) => void) => {
      workerCallback = cb;
    }),
  };
});

describe('Queue (mocked) integration', () => {
  it('adds and processes a job', async () => {
    const { createQueue, createWorker } = require('../queue');
    const queue = createQueue('test-queue', 'jobs');
    const jobPromise = new Promise((resolve) => {
      createWorker('test-queue', async (job: any) => {
        expect(job.data).toMatchObject({ foo: 'bar' });
        resolve(undefined);
      });
    });
    await queue.add('testJob', { foo: 'bar' });
    await jobPromise;
  });
}); 