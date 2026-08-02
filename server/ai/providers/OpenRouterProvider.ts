import { AIProvider, AIRequestOptions, AIResponse } from '../types.js';

export class OpenRouterProvider implements AIProvider {
  name = "OpenRouter";

  isConfigured(): boolean {
    return !!process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.trim().length > 0;
  }

  async generateContent(options: AIRequestOptions): Promise<AIResponse> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is missing");
    }

    const models = [
      "google/gemma-4-26b-a4b-it:free",
      "openai/gpt-oss-20b:free",
      "inclusionai/ling-3.0-flash:free",
      "nvidia/nemotron-nano-9b-v2:free"
    ];
    const timeoutMs = options.timeoutMs || 10000;

    const messages: any[] = [];
    if (options.systemPrompt) {
      messages.push({ role: "system", content: options.systemPrompt });
    }

    let userText = "";
    if (options.prompt) {
      userText = options.prompt;
    } else if (options.contents) {
      if (typeof options.contents === "string") {
        userText = options.contents;
      } else if (Array.isArray(options.contents)) {
        userText = options.contents.map(c => {
          if (typeof c === "string") return c;
          if (c.parts) {
            return c.parts.map((p: any) => p.text || JSON.stringify(p)).join("\n");
          }
          return JSON.stringify(c);
        }).join("\n");
      }
    }

    messages.push({ role: "user", content: userText || "Hello" });

    let lastErr: any = null;

    for (const model of models) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://ai.studio",
            "X-Title": "HSBC PayMe Admin Workspace"
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: options.temperature ?? 0.7
          }),
          signal: controller.signal
        });

        clearTimeout(timer);

        if (!res.ok) {
          const errBody = await res.text().catch(() => "");
          throw new Error(`OpenRouter HTTP ${res.status}: ${errBody}`);
        }

        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content?.trim();
        if (!text) {
          throw new Error(`OpenRouter returned empty response for model ${model}`);
        }

        return {
          text,
          provider: this.name,
          model,
          finishReason: data?.choices?.[0]?.finish_reason,
          usage: data?.usage
        };
      } catch (err: any) {
        clearTimeout(timer);
        lastErr = err;
      }
    }

    throw lastErr || new Error("All OpenRouter models failed");
  }
}
