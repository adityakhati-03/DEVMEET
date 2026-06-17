import { AIGenerateRequest, AIProvider } from './aiTypes';

export class FallbackProvider implements AIProvider {
  private providers: AIProvider[];

  constructor(providers: AIProvider[]) {
    if (providers.length === 0) {
      throw new Error('FallbackProvider requires at least one AIProvider.');
    }
    this.providers = providers;
  }

  async generateResponse(request: AIGenerateRequest): Promise<string> {
    let lastError: any;

    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[i];
      try {
        console.log(`[FallbackProvider] Attempting generation with provider ${i + 1}/${this.providers.length} (${provider.constructor.name})...`);
        const response = await provider.generateResponse(request);
        return response;
      } catch (error: any) {
        lastError = error;
        
        console.warn(`[FallbackProvider] Provider ${i + 1} (${provider.constructor.name}) failed: ${error.message}`);
        
        // We catch all errors and fall through to the next provider.
        // A ratelimit (429) or internal server error (500) will be seamlessly retried on the next provider.
        // If this is the last provider, the loop will exit and throw the error.
      }
    }

    console.error(`[FallbackProvider] All ${this.providers.length} providers failed.`);
    throw lastError;
  }
}
