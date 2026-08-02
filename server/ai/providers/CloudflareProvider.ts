import { AIProvider, AIRequestOptions, AIResponse } from '../types.js';

export class CloudflareProvider implements AIProvider {
  name = "Cloudflare Workers AI";

  isConfigured(): boolean {
    const token = process.env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLARE_API_KEY;
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.CF_ACCOUNT_ID;
    return !!(token && token.trim().length > 0 && accountId && accountId.trim().length > 0);
  }

  async generateContent(options: AIRequestOptions): Promise<AIResponse> {
    let token = process.env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLARE_API_KEY || '';
    let accountId = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.CF_ACCOUNT_ID || '';

    if (!token || !accountId) {
      throw new Error("Cloudflare API token or Account ID missing");
    }

    // Auto-detect swapped credentials
    if (accountId.startsWith('cfut_') || (accountId.length > 40 && token.length === 32)) {
      const temp = token;
      token = accountId;
      accountId = temp;
    }

    const models = ["@cf/meta/llama-3.3-70b-instruct-fp8-fast", "@cf/meta/llama-3.1-8b-instruct"];
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
        const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            messages,
            max_tokens: 2048
          }),
          signal: controller.signal
        });

        clearTimeout(timer);

        if (!res.ok) {
          const errBody = await res.text().catch(() => "");
          throw new Error(`Cloudflare HTTP ${res.status}: ${errBody}`);
        }

        const data = await res.json();
        const text = data?.result?.response?.trim() || data?.result?.text?.trim();
        if (!text) {
          throw new Error(`Cloudflare returned empty response for model ${model}`);
        }

        return {
          text,
          provider: this.name,
          model,
          usage: data?.result?.usage
        };
      } catch (err: any) {
        clearTimeout(timer);
        lastErr = err;
      }
    }

    throw lastErr || new Error("All Cloudflare models failed");
  }
}
