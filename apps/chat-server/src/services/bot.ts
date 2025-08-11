import { GoogleGenAI } from '@google/genai';

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({});

async function isProgrammingQuestion(content: string): Promise<boolean> {
  const contents = `
answer in yes or no only.
Is the following question related to web development, full stack engineering, web framework, angular, css, javascript, react etc..
question: ${content}
  `;
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents,
  });

  return response.text.toLocaleLowerCase().includes('yes');
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
