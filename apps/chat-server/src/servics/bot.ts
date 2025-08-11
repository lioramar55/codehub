import { GoogleGenAI } from '@google/genai';

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({});

// Basic filter for programming-related questions
function isProgrammingQuestion(content: string): boolean {
  const keywords = [
    'angular',
    'typescript',
    'javascript',
    'node',
    'express',
    'react',
    'vue',
    'frontend',
    'backend',
    'full stack',
    'http',
    'api',
    'database',
    'sql',
    'nosql',
    'html',
    'css',
  ];

  const lowerContent = content.toLowerCase();
  return keywords.some((k) => lowerContent.includes(k));
}

async function askBot(question: string): Promise<string> {
  const contents = `
You are a professional senior full stack engineer and an expert in all Angular versions.
Answer concisely in a message/reply style (max 4 sentences).
Question: ${question}
  `;
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents,
  });

  return response.text;
}

export const BotService = { isProgrammingQuestion, askBot };
