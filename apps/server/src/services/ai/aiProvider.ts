import { env } from '../../config/env';
import type { AIProvider } from './aiTypes';
import { GeminiProvider } from './geminiProvider';
import { GroqProvider } from './groqProvider';
import { FallbackProvider } from './fallbackProvider';
import { createError } from '../../middlewares/error.middleware';

export function getAIProvider(): AIProvider {
  const providers: AIProvider[] = [];

  // 1. Primary: Gemini
  if (env.geminiApiKey) {
    providers.push(new GeminiProvider(env.geminiApiKey, env.aiModel || 'gemini-2.0-flash'));
  }

  // 2. Fallback 1: Groq
  if (env.groqApiKey) {
    // using llama-3.3-70b-versatile as a robust fallback for reasoning/coding
    providers.push(new GroqProvider(env.groqApiKey, 'llama-3.3-70b-versatile')); 
  }

  if (providers.length === 0) {
    throw createError(
      'No AI providers configured. Please set GEMINI_API_KEY or GROQ_API_KEY in your .env file.',
      503,
      'AI_NOT_CONFIGURED'
    );
  }

  // Wrap all available providers in the fallback logic
  return new FallbackProvider(providers);
}
