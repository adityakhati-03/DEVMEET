import Groq from 'groq-sdk';
import { AIGenerateRequest, AIProvider } from './aiTypes';

export class GroqProvider implements AIProvider {
  private client: Groq;
  private model: string;

  constructor(apiKey: string, model: string = 'llama-3.1-8b-instant') {
    this.client = new Groq({ apiKey });
    this.model = model;
  }

  async generateResponse(request: AIGenerateRequest): Promise<string> {
    const messages = [
      { role: 'system' as const, content: request.systemPrompt },
      ...request.messages.map(m => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content }))
    ];

    try {
      const chatCompletion = await this.client.chat.completions.create({
        messages,
        model: this.model,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 2048,
        response_format: request.responseFormat === 'json' ? { type: 'json_object' } : undefined,
      });

      return chatCompletion.choices[0]?.message?.content || '';
    } catch (error: any) {
      console.error(`[GroqProvider] Error:`, error.message);
      throw error;
    }
  }
}
