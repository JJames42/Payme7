import { AIProvider, AIRequestOptions, AIResponse } from '../types.js';

export class GroqProvider implements AIProvider {
  name = "Groq";

  isConfigured(): boolean {
    return !!process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim().length > 0;
  }

  async generateContent(options: AIRequestOptions): Promise<AIResponse> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is missing");
    }

    const models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"];
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
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
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
          throw new Error(`Groq HTTP ${res.status}: ${errBody}`);
        }

        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content?.trim();
        if (!text) {
          throw new Error(`Groq returned empty response for model ${model}`);
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

    throw lastErr || new Error("All Groq models failed");
  }
}
