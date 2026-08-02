export interface AIResponse {
  text: string;
  provider: string;
  model: string;
  finishReason?: string;
  usage?: any;
}

export interface AIRequestOptions {
  prompt?: string;
  contents?: any[];
  systemPrompt?: string;
  temperature?: number;
  timeoutMs?: number;
  tools?: any[];
  attachments?: any[];
}

export interface AIProvider {
  name: string;
  isConfigured(): boolean;
  generateContent(options: AIRequestOptions): Promise<AIResponse>;
}
