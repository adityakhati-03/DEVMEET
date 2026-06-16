import { env } from '../../config/env';
import type { AIProvider } from './aiTypes';
import { GeminiProvider } from './geminiProvider';
import { createError } from '../../middlewares/error.middleware';

export function getAIProvider(): AIProvider {
  const providerType = env.aiProvider || 'gemini';
  
  if (providerType === 'gemini') {
    if (!env.geminiApiKey) {
      throw createError('GEMINI_API_KEY is not configured on the server. Please add it to your .env file.', 503, 'AI_NOT_CONFIGURED');
    }
    return new GeminiProvider(env.geminiApiKey, env.aiModel || 'gemini-2.0-flash');
  }

  throw createError(`Unsupported AI provider: ${providerType}`, 500, 'UNSUPPORTED_AI_PROVIDER');
}
