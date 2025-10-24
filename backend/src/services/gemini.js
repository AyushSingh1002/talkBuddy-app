// services/aiService.js
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export async function callAI(prompt) {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  if (!OPENROUTER_API_KEY) {
    return "I'm sorry, but I need an API key to respond. Please set OPENROUTER_API_KEY in your environment variables.";
  }

  try {
    const startTime = Date.now();

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "mistralai/mistral-7b-instruct:free",
        messages: [
          { role: "user", content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.7,
        top_p: 0.8,
        stream: false
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "TalkBuddy Chat App"
        },
        timeout: 15000
      }
    );

    const endTime = Date.now();
    console.log(`OpenRouter API call took: ${endTime - startTime}ms`);

    let text =
      response.data?.choices?.[0]?.message?.content ||
      "No response received.";

    // ---- Strip HTML/SGML tags ----
    text = text.replace(/<\/?[^>]+(>|$)/g, "").trim();

    return text;
  } catch (error) {
    console.error("OpenRouter API error:", error.response?.data || error.message);

    if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      return "I'm having trouble connecting to the AI service. Please check your internet connection and try again.";
    }

    if (error.code === "ECONNABORTED") {
      return "The AI service is taking too long to respond. Please try again.";
    }

    if (error.response?.status === 401) {
      return "Invalid API key. Please check your OPENROUTER_API_KEY.";
    }

    if (error.response?.status === 429) {
      return "Rate limit exceeded. Please wait a moment and try again.";
    }

    throw new Error("OpenRouter API request failed");
  }
}
