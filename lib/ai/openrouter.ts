import { BaseAIProvider, AIProviderOptions, AuthenticationError } from './base';
import { AIResponse } from '../types';

export class OpenRouterProvider extends BaseAIProvider {
  private baseUrl: string;
  private model: string;

  constructor(
    apiKey: string = process.env.OPENROUTER_API_KEY || '',
    options: AIProviderOptions = {}
  ) {
    super(apiKey, options.maxTokens, options.temperature);
    this.baseUrl = 'https://openrouter.ai/api/v1';
    this.model = options.model || 'openai/gpt-4';
  }

  async generate(prompt: string): Promise<string> {
    this.validateApiKey();
    this.validatePrompt(prompt);

    const sanitizedPrompt = this.sanitizePrompt(prompt);

    try {
      return await this.withRetry(async () => {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': typeof window !== 'undefined' ? window.location.href : 'https://your-app-url.com',
            'X-Title': 'Liminal Backrooms'
          },
          body: JSON.stringify({
            model: this.model,
            messages: [{ role: 'user', content: sanitizedPrompt }],
            max_tokens: this.maxTokens,
            temperature: this.temperature
          })
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new AuthenticationError('Invalid OpenRouter API key');
          }
          throw new Error(`OpenRouter API request failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
      });
    } catch (error: any) {
      this.handleError(error);
      throw error;
    }
  }

  async *stream(prompt: string): AsyncGenerator<string, void, unknown> {
    this.validateApiKey();
    this.validatePrompt(prompt);

    const sanitizedPrompt = this.sanitizePrompt(prompt);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': typeof window !== 'undefined' ? window.location.href : 'https://your-app-url.com',
          'X-Title': 'Liminal Backrooms'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: sanitizedPrompt }],
          max_tokens: this.maxTokens,
          temperature: this.temperature,
          stream: true
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new AuthenticationError('Invalid OpenRouter API key');
        }
        throw new Error(`OpenRouter API request failed: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            if (data.choices?.[0]?.delta?.content) {
              yield data.choices[0].delta.content;
            }
          }
        }
      }
    } catch (error: any) {
      this.handleError(error);
      throw error;
    }
  }

  getCapabilities(): string[] {
    return ['text', 'analysis', 'conversation', 'streaming'];
  }

  // OpenRouter-specific methods
  async listModels(): Promise<Array<{ id: string; name: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data.map((model: any) => ({
        id: model.id,
        name: model.name
      }));
    } catch (error: any) {
      this.handleError(error);
      throw error;
    }
  }

  setModel(model: string): void {
    this.model = model;
  }

  // Helper method to format conversation history
  async generateWithHistory(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
  ): Promise<string> {
    this.validateApiKey();

    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('Messages array must not be empty');
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': typeof window !== 'undefined' ? window.location.href : 'https://your-app-url.com',
          'X-Title': 'Liminal Backrooms'
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          max_tokens: this.maxTokens,
          temperature: this.temperature
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error: any) {
      this.handleError(error);
      throw error;
    }
  }

  // Method to create a conversation starter
  async startConversation(context?: string): Promise<string> {
    const systemMessage = {
      role: 'system' as const,
      content: context || 'You are guiding a user through the mysterious and eerie liminal backrooms. Maintain an atmosphere of subtle unease and mystery.'
    };

    const userMessage = {
      role: 'user' as const,
      content: 'I find myself in the backrooms. What do I see?'
    };

    return this.generateWithHistory([systemMessage, userMessage]);
  }
} 