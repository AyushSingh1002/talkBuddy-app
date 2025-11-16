// utils/buildPrompt.js
export function buildPrompt(character, history, userMessage) {
    // Use full conversation history for better context
    const historyText = history
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
  