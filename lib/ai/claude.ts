import { Anthropic } from '@anthropic-ai/sdk';
import { BaseAIProvider, AIProviderOptions, AuthenticationError } from './base';
import { AIResponse } from '../types';

export class ClaudeProvider extends BaseAIProvider {
  private client: Anthropic;
  private model: string;

  constructor(
    apiKey: string = process.env.ANTHROPIC_API_KEY || '',
    options: AIProviderOptions = {}
  ) {
    super(apiKey, options.maxTokens, options.temperature);
    this.model = options.model || 'claude-3';
    this.client = new Anthropic({ apiKey: this.apiKey });
  }

  async generate(prompt: string): Promise<string> {
    this.validateApiKey();
    this.validatePrompt(prompt);

    const sanitizedPrompt = this.sanitizePrompt(prompt);

    try {
      return await this.withRetry(async () => {
        const response = await this.client.messages.create({
          model: this.model,
          max_tokens: this.maxTokens,
          temperature: this.temperature,
          messages: [{ role: 'user', content: sanitizedPrompt }]
        });

        return response.content[0].text;
      });
    } catch (error: any) {
      if (error.status === 401) {
        throw new AuthenticationError('Invalid Anthropic API key');
      }
      this.handleError(error);
      throw error;
    }
  }

  async *stream(prompt: string): AsyncGenerator<string, void, unknown> {
    this.validateApiKey();
    this.validatePrompt(prompt);

    const sanitizedPrompt = this.sanitizePrompt(prompt);

    try {
      const stream = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        messages: [{ role: 'user', content: sanitizedPrompt }],
        stream: true
      });

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta') {
          yield chunk.delta.text;
        }
      }
    } catch (error: any) {
      if (error.status === 401) {
        throw new AuthenticationError('Invalid Anthropic API key');
      }
      this.handleError(error);
      throw error;
    }
  }

  getCapabilities(): string[] {
    return ['text', 'analysis', 'conversation', 'streaming'];
  }

  // Claude-specific methods
  async generateWithSystem(
    systemPrompt: string,
    userPrompt: string
  ): Promise<string> {
    this.validateApiKey();
    this.validatePrompt(userPrompt);
    this.validatePrompt(systemPrompt);

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      });

      return response.content[0].text;
    } catch (error: any) {
      this.handleError(error);
      throw error;
    }
  }

  async generateWithHistory(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
  ): Promise<string> {
    this.validateApiKey();

    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('Messages array must not be empty');
    }

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        messages: messages
      });

      return response.content[0].text;
    } catch (error: any) {
      this.handleError(error);
      throw error;
    }
  }

  // Utility method to format system prompts for Claude
  static formatSystemPrompt(instructions: string): string {
    return `\n\nHuman: You are an AI assistant in a liminal backrooms narrative experience. ${instructions}\n\nAssistant: I understand. I will act as an AI assistant in the liminal backrooms narrative, following these instructions: ${instructions}`;
  }

  // Method to create a conversation starter
  async startConversation(context?: string): Promise<string> {
    const systemPrompt = ClaudeProvider.formatSystemPrompt(
      context || 'You are guiding a user through the mysterious and eerie liminal backrooms. Maintain an atmosphere of subtle unease and mystery.'
    );

    const userPrompt = 'I find myself in the backrooms. What do I see?';

    return this.generateWithSystem(systemPrompt, userPrompt);
  }
} 