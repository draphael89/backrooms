import type { AIProvider, AIResponse } from '../types';

export type { AIProvider, AIResponse };

export interface AIProviderOptions {
  maxTokens?: number;
  temperature?: number;
  model?: string;
  streaming?: boolean;
}

export abstract class BaseAIProvider implements AIProvider {
  protected apiKey: string;
  protected maxTokens: number;
  protected temperature: number;

  constructor(apiKey: string, maxTokens = 1000, temperature = 0.7) {
    this.apiKey = apiKey;
    this.maxTokens = maxTokens;
    this.temperature = temperature;
  }

  abstract generate(prompt: string): Promise<string>;
  
  async *stream(prompt: string): AsyncGenerator<string, void, unknown> {
    // Default implementation for providers that don't support streaming
    const response = await this.generate(prompt);
    yield response;
  }

  handleError(error: Error): void {
    console.error(`AI Provider Error: ${error.message}`);
    throw error;
  }

  getCapabilities(): string[] {
    return ['text'];
  }

  protected validateApiKey(): void {
    if (!this.apiKey) {
      throw new Error('API key is required but not provided');
    }
  }

  protected validatePrompt(prompt: string): void {
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Invalid prompt provided');
    }
  }

  protected async handleResponse(response: Response): Promise<AIResponse> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(`API request failed: ${error.message}`);
    }
    return response.json();
  }

  protected sanitizePrompt(prompt: string): string {
    // Basic sanitization - remove potential harmful content
    return prompt.replace(/[<>]/g, '');
  }

  protected async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    delay = 1000
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
          continue;
        }
      }
    }

    throw lastError;
  }

  protected async rateLimit(
    operation: () => Promise<any>,
    requestsPerMinute: number
  ): Promise<any> {
    const now = Date.now();
    const minInterval = (60 * 1000) / requestsPerMinute;
    
    if (this.lastRequest && now - this.lastRequest < minInterval) {
      await new Promise(resolve => 
        setTimeout(resolve, minInterval - (now - this.lastRequest))
      );
    }
    
    this.lastRequest = Date.now();
    return operation();
  }

  private lastRequest: number = 0;
}

// Error types for specific AI provider errors
export class AIProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AIProviderError';
  }
}

export class RateLimitError extends AIProviderError {
  constructor(message = 'Rate limit exceeded') {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class AuthenticationError extends AIProviderError {
  constructor(message = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class InvalidPromptError extends AIProviderError {
  constructor(message = 'Invalid prompt provided') {
    super(message);
    this.name = 'InvalidPromptError';
  }
} 