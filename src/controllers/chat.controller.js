import { callAI } from "../services/gemini.js";
import { buildPrompt } from "../utils/prompt.generator.js";
import { findCharacterById, findCharacterByName } from "./character.controller.js";
import { ChatService } from "../services/chat.service.js";


export const chatStart = async (req, res) => {
  try {
    const { message, characterId, sessionId } = req.body;
    
    if (!message) return res.status(400).json({ error: "Message required" });
    if (!characterId) return res.status(400).json({ error: "Character ID required" });
    if (!sessionId) return res.status(400).json({ error: "Session ID required" });

    // Get character data - try by name first (for easier testing), then by ID
    let character = await findCharacterByName(characterId);
    if (!character) {
      // Try finding by UUID ID
      character = await findCharacterById(characterId);
    }
    
    if (!character) {
      return res.status(404).json({ 
        error: "Character not found", 
        hint: "Try using character name (luna, kai, nova) or check available characters at /api/characters" 
      });
    }

    // Get or create conversation using the actual character ID from database
    const conversationId = await ChatService.getOrCreateConversation(character.id, sessionId);
    
    // Get full conversation history
    const messageHistory = await ChatService.getConversationHistory(conversationId);

    // Build prompt with previous history for this character
    const prompt = buildPrompt(character, messageHistory, message);

    // Call Gemini API
    const reply = await callAI(prompt);

    // Parallelize database operations for faster response
    const [userMessage, assistantMessage] = await Promise.all([
      ChatService.saveMessage(conversationId, 'user', message),
      ChatService.saveMessage(conversationId, 'assistant', reply)
    ]);

    // Update conversation last active (non-blocking)
    ChatService.updateLastActive(conversationId).catch(err => 
      console.error('Error updating last active:', err)
    );

    res.json({
      reply,
      conversationId,
      character: {
        id: character.id,
        name: character.name,
        avatar_url: character.avatar_url,
        voice_settings: character.voice_settings
      },
      totalMessages: messageHistory.length + 2, // Calculate without extra query
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

export const clearChatHistory = async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    if (!conversationId) {
      return res.status(400).json({ error: "Conversation ID required" });
    }

    // Delete conversation and all messages from database
    await ChatService.deleteConversation(conversationId);
    res.json({ message: `Chat history cleared for conversation ${conversationId}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// New function to get conversation history
export const getConversationHistory = async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    console.log(`Getting conversation history for ${conversationId}`);
    console.log('conversationId type:', typeof conversationId);
    console.log('conversationId value:', conversationId);
    
    if (!conversationId) {
      return res.status(400).json({ error: "Conversation ID required" });
    }

    // Validate conversationId format (should be UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(conversationId)) {
      return res.status(400).json({ error: "Invalid conversation ID format" });
    }

    // Ensure conversationId is a string
    const cleanConversationId = String(conversationId).trim();
    console.log('Clean conversation ID:', cleanConversationId);

    const history = await ChatService.getConversationHistory(cleanConversationId);
    console.log(`Returning ${history.length} messages for conversation ${cleanConversationId}`);
    res.json({ messages: history });
  } catch (err) {
    console.error('Error in getConversationHistory:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ error: "Server error", details: err.message });
  }
}