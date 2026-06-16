import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIProvider, AIGenerateRequest } from './aiTypes';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000;

export class GeminiProvider implements AIProvider {
  private genAI: GoogleGenerativeAI;
  private defaultModel: string;

  constructor(apiKey: string, model: string = 'gemini-2.0-flash') {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.defaultModel = model;
  }

  async generateResponse(request: AIGenerateRequest): Promise<string> {
    const config: any = {
      temperature: request.temperature ?? 0.7,
      maxOutputTokens: request.maxTokens ?? 8192,
    };

    if (request.responseFormat === 'json') {
      config.responseMimeType = "application/json";
    }

    const model = this.genAI.getGenerativeModel({
      model: this.defaultModel,
      systemInstruction: request.systemPrompt,
      generationConfig: config,
    });

    let lastError: any = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const chat = model.startChat({
          history: request.messages.slice(0, -1).map((msg) => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
          })),
        });

        const lastMessage = request.messages[request.messages.length - 1];

        if (!lastMessage || lastMessage.role !== 'user') {
          const prompt = request.systemPrompt + '\n\n' + request.messages.map(m => `${m.role}: ${m.content}`).join('\n');
          const result = await model.generateContent(prompt);
          return result.response.text();
        }

        const result = await chat.sendMessage(lastMessage.content);
        return result.response.text();
      } catch (err: any) {
        lastError = err;
        const status = err?.status || err?.response?.status || err?.code;
        const message = err?.message || 'Unknown error';

        console.error(`[Gemini] Attempt ${attempt + 1}/${MAX_RETRIES} failed:`, {
          status,
          message: message.substring(0, 200),
        });

        // Retry on rate limit (429) or server errors (500, 503)
        const isRetryable = status === 429 || status === 500 || status === 503 ||
          message.includes('429') || message.includes('RESOURCE_EXHAUSTED') ||
          message.includes('quota') || message.includes('rate');

        if (isRetryable && attempt < MAX_RETRIES - 1) {
          const delay = BASE_DELAY_MS * Math.pow(2, attempt);
          console.log(`[Gemini] Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        break;
      }
    }

    // All retries exhausted
    const friendlyMessage = lastError?.message?.includes('429') || lastError?.message?.includes('RESOURCE_EXHAUSTED')
      ? 'AI rate limit reached. Please wait a minute and try again.'
      : `AI generation failed: ${lastError?.message || 'Unknown error'}`;

    throw new Error(friendlyMessage);
  }
}
