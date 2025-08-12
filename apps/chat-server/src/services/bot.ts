import { GoogleGenAI } from '@google/genai';
import { PROGRAMMING_KEYWORDS } from '../utils/constants';
import { logError, logInfo, logWarn } from '../utils/logger';

// Initialize GoogleGenAI with API key
function getAI() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

function isProgrammingQuestion(content: string): boolean {
  const lowerContent = content.toLowerCase();

  // Check for programming keywords in all languages
  for (const languageKeywords of Object.values(PROGRAMMING_KEYWORDS)) {
    for (const keyword of languageKeywords) {
      if (lowerContent.includes(keyword.toLowerCase())) {
        return true;
      }
    }
  }

  return false;
}

async function askBot(question: string): Promise<string> {
  try {
    // Check if API key is available
    if (!process.env.GEMINI_API_KEY) {
      logError(
        new Error('GEMINI_API_KEY environment variable is not set'),
        'Bot Service'
      );
      throw new Error('Bot API key not configured');
    }

    logInfo('Sending question to bot', {
      questionLength: question.length,
      hasApiKey: !!process.env.GEMINI_API_KEY,
    });

    const ai = getAI();
    const contents = `
You are a professional senior full stack engineer and an expert in all Angular versions.
Answer concisely in a message/reply style (max 4 sentences) in the same language as the question.

Question: ${question}
  `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
    });

    const botReply = response.text;
    logInfo('Bot response received', {
      replyLength: botReply.length,
      questionLength: question.length,
    });

    return botReply;
  } catch (error) {
    logError(error as Error, 'Bot Service - askBot');
    throw error;
  }
}

export const BotService = { isProgrammingQuestion, askBot };
