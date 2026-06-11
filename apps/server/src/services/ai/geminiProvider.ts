import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIProvider, AIGenerateRequest } from './aiTypes';

export class GeminiProvider implements AIProvider {
  private genAI: GoogleGenerativeAI;
  private defaultModel: string;

  constructor(apiKey: string, model: string = 'gemini-1.5-flash') {
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

    const chat = model.startChat({
      history: request.messages.slice(0, -1).map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      })),
    });

    const lastMessage = request.messages[request.messages.length - 1];
    
    // If there's only system prompt and no messages, or the last is not user, we handle it
    if (!lastMessage || lastMessage.role !== 'user') {
      // Direct text generation if it's not a conversational turn
      const prompt = request.systemPrompt + '\n\n' + request.messages.map(m => `${m.role}: ${m.content}`).join('\n');
      const result = await model.generateContent(prompt);
      return result.response.text();
    }

    const result = await chat.sendMessage(lastMessage.content);
    return result.response.text();
  }
}
