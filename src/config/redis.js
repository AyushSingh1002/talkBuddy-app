import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Upstash Redis client
const redisClient = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Test Redis connection
const connectRedis = async () => {
  try {
    // Test the connection with a simple ping
    await redisClient.ping();
    console.log('✅ Upstash Redis connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to Upstash Redis:', error);
    console.log('💡 Make sure to set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in your .env file');
    return false;
  }
};

// Graceful shutdown (Upstash doesn't need explicit disconnection)
const disconnectRedis = async () => {
  try {
    console.log('✅ Upstash Redis connection closed');
  } catch (error) {
    console.error('❌ Error closing Upstash Redis:', error);
  }
};

export { redisClient, connectRedis, disconnectRedis };
