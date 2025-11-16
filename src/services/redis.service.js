import { redisClient } from '../config/redis.js';

export class RedisService {
  // Cache conversation history
  static async cacheConversationHistory(conversationId, messages, ttl = 3600) {
    try {
      const key = `conversation:${conversationId}:history`;
      const data = JSON.stringify(messages);
      await redisClient.setex(key, ttl, data);
      return true;
    } catch (error) {
      console.error('Error caching conversation history:', error);
      return false;
    }
  }

  // Get cached conversation history
  static async getCachedConversationHistory(conversationId) {
    try {
      const key = `conversation:${conversationId}:history`;
      const data = await redisClient.get(key);
      
      if (!data) return null;
      
      // Handle different data types from Upstash
      if (typeof data === 'string') {
        return JSON.parse(data);
      } else if (Array.isArray(data)) {
        return data;
      } else if (typeof data === 'object') {
        return data;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting cached conversation history:', error);
      return null;
    }
  }

  // Add message to cached history
  static async addMessageToCache(conversationId, message, ttl = 3600) {
    try {
      const key = `conversation:${conversationId}:history`;
      
      // Get existing history
      let history = await this.getCachedConversationHistory(conversationId);
      if (!history || !Array.isArray(history)) {
        history = [];
      }
      
      // Add new message
      history.push(message);
      
      // Keep all messages for full conversation history
      
      // Cache updated history
      await this.cacheConversationHistory(conversationId, history, ttl);
      return history;
    } catch (error) {
      console.error('Error adding message to cache:', error);
      // Return empty array as fallback
      return [];
    }
  }

  // Clear conversation cache
  static async clearConversationCache(conversationId) {
    try {
      const key = `conversation:${conversationId}:history`;
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error('Error clearing conversation cache:', error);
      return false;
    }
  }

  // Cache character data
  static async cacheCharacter(characterId, characterData, ttl = 1800) {
    try {
      const key = `character:${characterId}`;
      const data = JSON.stringify(characterData);
      await redisClient.setex(key, ttl, data);
      return true;
    } catch (error) {
      console.error('Error caching character:', error);
      return false;
    }
  }

  // Get cached character
  static async getCachedCharacter(characterId) {
    try {
      const key = `character:${characterId}`;
      const data = await redisClient.get(key);
      
      if (!data) return null;
      
      // Handle different data types from Upstash
      if (typeof data === 'string') {
        return JSON.parse(data);
      } else if (typeof data === 'object') {
        return data;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting cached character:', error);
      return null;
    }
  }

  // Cache recent conversations for a session
  static async cacheRecentConversations(sessionId, conversations, ttl = 1800) {
    try {
      const key = `session:${sessionId}:conversations`;
      const data = JSON.stringify(conversations);
      await redisClient.setex(key, ttl, data);
      return true;
    } catch (error) {
      console.error('Error caching recent conversations:', error);
      return false;
    }
  }

  // Get cached recent conversations
  static async getCachedRecentConversations(sessionId) {
    try {
      const key = `session:${sessionId}:conversations`;
      const data = await redisClient.get(key);
      
      if (!data) return null;
      
      // Handle different data types from Upstash
      if (typeof data === 'string') {
        return JSON.parse(data);
      } else if (Array.isArray(data)) {
        return data;
      } else if (typeof data === 'object') {
        return data;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting cached recent conversations:', error);
      return null;
    }
  }

  // Health check
  static async healthCheck() {
    try {
      await redisClient.ping();
      return true;
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  }
}
