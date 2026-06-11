export interface AIMessage {
  role: 'system' | 'assistant' | 'user';
  content: string;
}

export interface AIGenerateRequest {
  systemPrompt: string;
  messages: AIMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'json' | 'text';
}

export interface AIProvider {
  generateResponse(request: AIGenerateRequest): Promise<string>;
}
