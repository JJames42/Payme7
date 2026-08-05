import { GoogleGenAI } from '@google/genai';
import { AIProvider, AIRequestOptions, AIResponse } from '../types.js';

export class GeminiProvider implements AIProvider {
  name = "Google Gemini";
  private client: GoogleGenAI | null = null;

  isConfigured(): boolean {
    return !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0;
  }

  private getClient(): GoogleGenAI {
    if (!this.client && process.env.GEMINI_API_KEY) {
      this.client = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY,
        vertexai: false
      });
    }
    if (!this.client) {
      throw new Error("GEMINI_API_KEY is not set");
    }
    return this.client;
  }

  async generateContent(options: AIRequestOptions): Promise<AIResponse> {
    const client = this.getClient();
    const models = ["gemini-3.6-flash", "gemini-3.1-flash-lite", "gemini-2.5-flash", "gemini-flash-latest"];
    const timeoutMs = options.timeoutMs || 10000;

    let promptContents: any = options.contents || options.prompt;
    if (!promptContents) {
      throw new Error("No prompt or contents provided for Gemini");
    }

    let lastErr: any = null;

    for (const model of models) {
      try {
        const reqObj: any = {
          model,
          contents: promptContents,
          config: {
            temperature: options.temperature ?? 0.7
          }
        };

        if (options.systemPrompt) {
          reqObj.config.systemInstruction = options.systemPrompt;
        }

        if (options.tools && options.tools.length > 0) {
          reqObj.config.tools = options.tools;
        }

        const response: any = await Promise.race([
          client.models.generateContent(reqObj),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Gemini timeout (${timeoutMs}ms)`)), timeoutMs)
          )
        ]);

        const text = response?.text?.trim();
        if (text) {
          return {
            text,
            provider: this.name,
            model,
            finishReason: response?.candidates?.[0]?.finishReason,
            usage: response?.usageMetadata
          };
        }

        // If response has function calls (tools), return stringified function calls or raw text
        if (response?.functionCalls && response.functionCalls.length > 0) {
          return {
            text: JSON.stringify({ functionCalls: response.functionCalls }),
            provider: this.name,
            model,
            usage: response?.usageMetadata
          };
        }

        throw new Error(`Empty response from Gemini model ${model}`);
      } catch (err: any) {
        lastErr = err;
        // Continue to next model in Gemini's model list if available
      }
    }

    throw lastErr || new Error("All Gemini models failed");
  }
}
