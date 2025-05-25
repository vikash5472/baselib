import { connectRedis, getRedis, cacheSet, cacheGet, publish, subscribe } from '../redis';

async function runRedisTest() {
  connectRedis('test', { host: 'localhost', port: 6379 });
  const redis = getRedis('test');

  // Set/Get
  await redis.set('foo', 'bar');
  const val = await redis.get('foo');
  console.log('Set/Get:', val);

  // Cache helpers
  await cacheSet('user:1', { id: 1, name: 'Test' }, 60);
  const cached = await cacheGet('user:1');
  console.log('Cache:', cached);

  // Pub/Sub
  subscribe('test-channel', msg => console.log('Received pub/sub:', msg));
  await publish('test-channel', 'hello');

  // Wait a moment for pub/sub
  setTimeout(() => process.exit(0), 1000);
}

runRedisTest().catch(console.error); 