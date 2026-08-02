import { AIProvider, AIRequestOptions, AIResponse } from '../types.js';

export class HuggingFaceProvider implements AIProvider {
  name = "Hugging Face";

  isConfigured(): boolean {
    const key = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN;
    return !!(key && key.trim().length > 0);
  }

  async generateContent(options: AIRequestOptions): Promise<AIResponse> {
    const apiKey = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN;
    if (!apiKey) {
      throw new Error("HUGGINGFACE_API_KEY / HF_TOKEN is missing");
    }

    const models = [
      "meta-llama/Llama-3.3-70B-Instruct",
      "Qwen/Qwen2.5-72B-Instruct",
      "meta-llama/Llama-3.1-8B-Instruct"
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
        const url = "https://router.huggingface.co/v1/chat/completions";
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model,
            messages,
            max_tokens: 1024,
            temperature: options.temperature ?? 0.7
          }),
          signal: controller.signal
        });

        clearTimeout(timer);

        if (!res.ok) {
          const errBody = await res.text().catch(() => "");
          throw new Error(`Hugging Face HTTP ${res.status}: ${errBody}`);
        }

        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content?.trim();
        if (!text) {
          throw new Error(`Hugging Face returned empty response for model ${model}`);
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

    throw lastErr || new Error("All Hugging Face models failed");
  }
}
