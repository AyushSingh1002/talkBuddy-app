import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { RedisService } from './redis.service.js';

export class ChatService {
  // Get or create conversation
  static async getOrCreateConversation(characterId, sessionId) {
    try {
      // Try to find existing conversation
      const existingQuery = `
        SELECT id FROM conversations 
        WHERE character_id = $1 AND session_id = $2
      `;
      const existing = await pool.query(existingQuery, [characterId, sessionId]);
      
      if (existing.rows.length > 0) {
        return existing.rows[0].id;
      }
      
      // Create new conversation
      const insertQuery = `
        INSERT INTO conversations (id, character_id, session_id)
        VALUES ($1, $2, $3)
        RETURNING id
      `;
      const conversationId = uuidv4();
      const result = await pool.query(insertQuery, [conversationId, characterId, sessionId]);
      
      return result.rows[0].id;
    } catch (error) {
      console.error('Error getting/creating conversation:', error);
      throw error;
    }
  }

  // Save message to database and update Redis cache
  static async saveMessage(conversationId, role, content) {
    try {
      const query = `
        INSERT INTO messages (conversation_id, role, content)
        VALUES ($1, $2, $3)
        RETURNING id, created_at
      `;
      const result = await pool.query(query, [conversationId, role, content]);
      const message = result.rows[0];
      
      // Add message to Redis cache
      const messageData = {
        role,
        content,
        created_at: message.created_at
      };
      await RedisService.addMessageToCache(conversationId, messageData);
      
      return message;
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  }

  // Get conversation history (simplified without Redis for now)
  static async getConversationHistory(conversationId) {
    try {
      console.log(`Getting conversation history for ${conversationId}`);
      console.log(`conversationId type: ${typeof conversationId}`);
      console.log(`conversationId value: ${JSON.stringify(conversationId)}`);
      
      // Validate conversationId
      if (!conversationId) {
        throw new Error('Conversation ID is required');
      }
      
      // Convert to string if it's not already
      const stringConversationId = String(conversationId).trim();
      if (!stringConversationId) {
        throw new Error('Conversation ID cannot be empty');
      }
      
      console.log(`Using conversationId: ${stringConversationId}`);
      
      // Get from database directly
      const query = `
        SELECT id, role, content, created_at
        FROM messages
        WHERE conversation_id = $1
        ORDER BY created_at ASC
      `;
      
      // Ensure conversationId is properly formatted as an array
      const queryParams = [stringConversationId];
      console.log('Query parameters:', queryParams);
      console.log('Query parameters type:', typeof queryParams);
      console.log('Query parameters length:', queryParams.length);
      
      // Test with a simple query first
      try {
        console.log('Testing simple query...');
        const testResult = await pool.query('SELECT 1 as test');
        console.log('Test query successful:', testResult.rows);
        
        // Test with a parameterized query
        console.log('Testing parameterized query...');
        const paramTestResult = await pool.query('SELECT $1 as test_param', ['test_value']);
        console.log('Parameterized query successful:', paramTestResult.rows);
      } catch (testError) {
        console.error('Test query failed:', testError);
        throw testError;
      }
      
      console.log('Executing main query...');
      
      // Try alternative approach if the first one fails
      let result;
      try {
        result = await pool.query(query, queryParams);
      } catch (queryError) {
        console.error('First query attempt failed:', queryError);
        console.log('Trying alternative query format...');
        
        // Try with explicit parameter binding
        const alternativeQuery = `
          SELECT id, role, content, created_at
          FROM messages
          WHERE conversation_id = $1
          ORDER BY created_at ASC
        `;
        
        result = await pool.query(alternativeQuery, [stringConversationId]);
        console.log('Alternative query successful');
      }
      const history = result.rows;
      
      console.log(`Found ${history.length} messages for conversation ${conversationId}`);
      console.log('Raw database result:', history);
      
      // Try to cache in Redis (but don't fail if Redis is down)
      try {
        await RedisService.cacheConversationHistory(conversationId, history);
        console.log('💾 Cached conversation history to Redis');
      } catch (redisError) {
        console.log('Redis caching failed (non-critical):', redisError.message);
      }
      
      return history;
    } catch (error) {
      console.error('Error getting conversation history:', error);
      throw error;
    }
  }

  // Update conversation last_active
  static async updateLastActive(conversationId) {
    try {
      const query = `
        UPDATE conversations 
        SET last_active = CURRENT_TIMESTAMP 
        WHERE id = $1
      `;
      await pool.query(query, [conversationId]);
    } catch (error) {
      console.error('Error updating last active:', error);
      throw error;
    }
  }

  // Get conversation by ID
  static async getConversationById(conversationId) {
    try {
      const query = `
        SELECT c.*, ch.name as character_name, ch.avatar, ch.color
        FROM conversations c
        JOIN characters ch ON c.character_id = ch.id
        WHERE c.id = $1
      `;
      const result = await pool.query(query, [conversationId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting conversation:', error);
      throw error;
    }
  }

  // Delete conversation and all messages
  static async deleteConversation(conversationId) {
    try {
      const query = `DELETE FROM conversations WHERE id = $1`;
      await pool.query(query, [conversationId]);
      
      // Clear Redis cache for this conversation
      await RedisService.clearConversationCache(conversationId);
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }
}
