export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface CodeGenerationOptions {
  framework: string;
  features: string[];
  styling: string;
}

export interface GeminiConfig {
  apiKey: string;
  model?: string;
  temperature: number;
  maxTokens: number;
  topP?: number;
  topK?: number;
}