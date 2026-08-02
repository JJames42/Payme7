import { AIProvider, AIRequestOptions, AIResponse } from '../types.js';

export class CerebrasProvider implements AIProvider {
  name = "Cerebras";

  isConfigured(): boolean {
    return !!process.env.CEREBRAS_API_KEY && process.env.CEREBRAS_API_KEY.trim().length > 0;
  }

  async generateContent(options: AIRequestOptions): Promise<AIResponse> {
    const apiKey = process.env.CEREBRAS_API_KEY;
    if (!apiKey) {
      throw new Error("CEREBRAS_API_KEY is missing");
    }

    const models = ["gpt-oss-120b", "gemma-4-31b", "zai-glm-4.7"];
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
        const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
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
          if (res.status === 402) {
            console.warn(`[Cerebras Warning] HTTP 402 Payment Required: ${errBody}. Skipping Cerebras provider immediately.`);
            throw new Error(`Cerebras HTTP 402 (Payment Required): ${errBody}`);
          }
          throw new Error(`Cerebras HTTP ${res.status}: ${errBody}`);
        }

        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content?.trim();
        if (!text) {
          throw new Error(`Cerebras returned empty response for model ${model}`);
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
        if (err?.message?.includes("HTTP 402")) {
          throw err;
        }
      }
    }

    throw lastErr || new Error("All Cerebras models failed");
  }
}
