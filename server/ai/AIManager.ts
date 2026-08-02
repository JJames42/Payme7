import { AIProvider, AIRequestOptions, AIResponse } from './types.js';
import { GeminiProvider } from './providers/GeminiProvider.js';
import { GroqProvider } from './providers/GroqProvider.js';
import { CloudflareProvider } from './providers/CloudflareProvider.js';
import { HuggingFaceProvider } from './providers/HuggingFaceProvider.js';
import { CerebrasProvider } from './providers/CerebrasProvider.js';
import { OpenRouterProvider } from './providers/OpenRouterProvider.js';

export class AIManager {
  private providers: AIProvider[] = [];

  constructor() {
    // Default provider failover hierarchy strictly in specified order:
    // 1. Google Gemini -> 2. Groq -> 3. Cloudflare -> 4. Hugging Face -> 5. Cerebras -> 6. OpenRouter
    this.providers = [
      new GeminiProvider(),
      new GroqProvider(),
      new CloudflareProvider(),
      new HuggingFaceProvider(),
      new CerebrasProvider(),
      new OpenRouterProvider()
    ];
  }

  /**
   * Register a new provider to the failover chain.
   */
  registerProvider(provider: AIProvider, priority?: number): void {
    if (typeof priority === 'number' && priority >= 0 && priority < this.providers.length) {
      this.providers.splice(priority, 0, provider);
    } else {
      this.providers.push(provider);
    }
  }

  /**
   * Get all registered providers
   */
  getProviders(): AIProvider[] {
    return [...this.providers];
  }

  /**
   * Execute content generation with automatic sequential failover
   */
  async generateContent(options: AIRequestOptions): Promise<AIResponse> {
    const attemptedProviders: { name: string; latencyMs: number; error: string }[] = [];

    for (const provider of this.providers) {
      if (!provider.isConfigured()) {
        console.log(`[AI Provider Manager] Skipping unconfigured provider: ${provider.name}`);
        continue;
      }

      const startTime = Date.now();
      try {
        console.log(`[AI Provider Manager] Attempting provider: ${provider.name}...`);
        const result = await provider.generateContent(options);
        const latencyMs = Date.now() - startTime;

        if (result && result.text && result.text.trim().length > 0) {
          console.log(
            `[AI Provider Selected] Provider: ${result.provider} | Model: ${result.model} | Latency: ${latencyMs}ms | Tokens: ${JSON.stringify(result.usage || {})}`
          );
          return {
            ...result,
            usage: result.usage || { latencyMs }
          };
        }
        throw new Error("Received empty or invalid response string from provider");
      } catch (err: any) {
        const latencyMs = Date.now() - startTime;
        const errMsg = err?.message || String(err);
        attemptedProviders.push({ name: provider.name, latencyMs, error: errMsg });

        console.warn(
          `[AI Failover Warning] Provider '${provider.name}' failed after ${latencyMs}ms. Reason: ${errMsg}. Failover to next provider...`
        );
      }
    }

    console.error("[AI Provider Manager] Critical Error: All configured AI providers failed.", attemptedProviders);
    throw new Error("AI is currently unavailable");
  }
}

// Export singleton instance for app-wide usage
export const aiManager = new AIManager();
