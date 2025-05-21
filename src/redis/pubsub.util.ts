import { getRedis } from './redis.manager';
import Redis from 'ioredis';

const subscriberClients: Map<string, Redis> = new Map();

/**
 * Subscribe to a Redis channel
 * @param channel The channel to subscribe to.
 * @param onMessage Callback function to handle incoming messages.
 * @param redisName Optional name of the Redis client to use. Defaults to 'default'.
 */
export function subscribe(
  channel: string,
  onMessage: (msg: string) => void,
  redisName: string = 'default'
): void {
  let subscriber = subscriberClients.get(redisName);
  if (!subscriber) {
    subscriber = getRedis(redisName).duplicate(); // Duplicate client for subscriber
    subscriberClients.set(redisName, subscriber);
    subscriber.on('message', (ch: string, msg: string) => {
      if (ch === channel) {
        onMessage(msg);
      }
    });
  }
  subscriber.subscribe(channel);
}

/**
 * Publish to a channel
 * @param channel The channel to publish the message to.
 * @param message The message to publish.
 * @param redisName Optional name of the Redis client to use. Defaults to 'default'.
 * @returns The number of clients that received the message.
 */
export async function publish(
  channel: string,
  message: string,
  redisName: string = 'default'
): Promise<number> {
  const publisher = getRedis(redisName);
  return publisher.publish(channel, message);
}
