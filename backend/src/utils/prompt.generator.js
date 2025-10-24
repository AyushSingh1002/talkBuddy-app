// utils/buildPrompt.js
export function buildPrompt(character, history, userMessage) {
    // Limit history to last 4 messages for faster processing
    const recentHistory = history.slice(-4);
    
    const historyText = recentHistory
      .map((msg) =>
        msg.role === "user"
          ? `U: ${msg.content}`
          : `${character.name}: ${msg.content}`
      )
      .join("\n");
  
    return `You are ${character.name}. ${character.persona_prompt}

${historyText ? `Recent:\n${historyText}\n` : ''}User: ${userMessage}

Respond as ${character.name} (keep it under 100 words):`;
  }
  