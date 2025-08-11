import { GoogleGenAI } from '@google/genai';
import { PROGRAMMING_KEYWORDS } from '../utils/constants';

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({});

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
  const contents = `
You are a professional senior full stack engineer and an expert in all Angular versions.
Answer concisely in a message/reply style (max 4 sentences) in the same language as the question.

Question: ${question}
  `;
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents,
  });

  return response.text;
}

export const BotService = { isProgrammingQuestion, askBot };
