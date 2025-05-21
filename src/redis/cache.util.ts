import { getRedis } from './redis.manager';

/**
 * Stores object as JSON with TTL
 * @param key The key to store the value under.
 * @param value The value to store.
 * @param ttlSeconds The time-to-live for the key in seconds.
 * @param redisName Optional name of the Redis client to use. Defaults to 'default'.
 */
export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number,
  redisName: string = 'default'
): Promise<void> {
  const redis = getRedis(redisName);
  await redis.setex(key, ttlSeconds, JSON.stringify(value));
}

/**
 * Retrieves object and parses JSON
 * @param key The key to retrieve the value from.
 * @param redisName Optional name of the Redis client to use. Defaults to 'default'.
 * @returns The parsed object or null if not found.
 */
export async function cacheGet<T = any>(
  key: string,
  redisName: string = 'default'
): Promise<T | null> {
  const redis = getRedis(redisName);
  const data = await redis.get(key);
  return data ? JSON.parse(data) as T : null;
}

/**
 * Deletes a cached key
 * @param key The key to delete.
 * @param redisName Optional name of the Redis client to use. Defaults to 'default'.
 * @returns The number of keys deleted.
 */
export async function cacheDel(key: string, redisName: string = 'default'): Promise<number> {
  const redis = getRedis(redisName);
  return redis.del(key);
}
