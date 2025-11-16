// controllers/characterController.js
import pool from "../config/database.js";
import { RedisService } from "../services/redis.service.js";

export const getAllCharacters = async (req, res) => {
  try {
    const query = `
      SELECT id, name, persona_prompt, avatar_url, voice_settings, created_at
      FROM characters
      ORDER BY created_at ASC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch characters" });
  }
};

export const getCharacterById = async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT id, name, persona_prompt, avatar_url, voice_settings, created_at
      FROM characters
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Character not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch character" });
  }
};

export const getCharacterByName = async (req, res) => {
  try {
    const { name } = req.params;
    
    // Try Redis cache first
    const cachedCharacter = await RedisService.getCachedCharacter(name);
    if (cachedCharacter) {
      console.log('📦 Retrieved character from Redis cache');
      return res.json(cachedCharacter);
    }

    // If not in cache, get from database
    const query = `
      SELECT id, name, persona_prompt, avatar_url, voice_settings, created_at
      FROM characters
      WHERE LOWER(name) = LOWER($1)
    `;
    const result = await pool.query(query, [name]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Character not found" });
    }

    const character = result.rows[0];
    
    // Cache the character for future requests
    await RedisService.cacheCharacter(name, character);
    console.log('💾 Cached character to Redis');

    res.json(character);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch character" });
  }
};

// Helper function to get character data without sending response
export const findCharacterById = async (characterId) => {
  try {
    // Validate UUID format first
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(characterId)) {
      return null; // Not a valid UUID, skip this lookup
    }
    
    const query = `
      SELECT id, name, persona_prompt, avatar_url, voice_settings
      FROM characters
      WHERE id = $1
    `;
    const result = await pool.query(query, [characterId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error finding character by ID:', error);
    return null;
  }
};

// Helper function to get character by name (for easier testing)
export const findCharacterByName = async (characterName) => {
  try {
    // Try Redis cache first
    const cachedCharacter = await RedisService.getCachedCharacter(characterName);
    if (cachedCharacter) {
      console.log('📦 Retrieved character from Redis cache');
      return cachedCharacter;
    }

    // If not in cache, get from database
    const query = `
      SELECT id, name, persona_prompt, avatar_url, voice_settings
      FROM characters
      WHERE LOWER(name) = LOWER($1)
    `;
    const result = await pool.query(query, [characterName]);
    const character = result.rows[0] || null;
    
    // Cache the character if found
    if (character) {
      await RedisService.cacheCharacter(characterName, character);
      console.log('💾 Cached character to Redis');
    }
    
    return character;
  } catch (error) {
    console.error('Error finding character by name:', error);
    return null;
  }
};