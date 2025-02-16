import Replicate from 'replicate';
import { BaseAIProvider, AIProviderOptions, AuthenticationError } from './base';
import { AIResponse } from '../types';

type ModelID = `${string}/${string}` | `${string}/${string}:${string}`;

export class ReplicateProvider extends BaseAIProvider {
  private client: Replicate;
  private model: ModelID;

  constructor(
    apiKey: string = process.env.REPLICATE_API_TOKEN || '',
    options: AIProviderOptions = {}
  ) {
    super(apiKey, options.maxTokens, options.temperature);
    this.client = new Replicate({ auth: this.apiKey });
    this.model = (options.model || 'stability-ai/stable-diffusion:27b93a2413e7f36cd83da926f3656280b2931564ff050bf9575f1fdf9bcd7478') as ModelID;
  }

  async generate(prompt: string): Promise<string> {
    this.validateApiKey();
    this.validatePrompt(prompt);

    const sanitizedPrompt = this.sanitizePrompt(prompt);

    try {
      return await this.withRetry(async () => {
        const output = await this.client.run(
          this.model,
          {
            input: {
              prompt: sanitizedPrompt
            }
          }
        );

        // Handle different output types
        if (Array.isArray(output)) {
          return output[0] as string;
        } else if (typeof output === 'string') {
          return output;
        } else if (typeof output === 'object' && output !== null) {
          return JSON.stringify(output);
        }

        throw new Error('Unexpected output format from Replicate');
      });
    } catch (error: any) {
      if (error.message.includes('Authentication')) {
        throw new AuthenticationError('Invalid Replicate API token');
      }
      this.handleError(error);
      throw error;
    }
  }

  async *stream(prompt: string): AsyncGenerator<string, void, unknown> {
    // Replicate doesn't support streaming in the same way as other providers
    // We'll yield the final result
    const result = await this.generate(prompt);
    yield result;
  }

  getCapabilities(): string[] {
    if (this.model.includes('stable-diffusion')) {
      return ['image'];
    }
    return ['text'];
  }

  // Replicate-specific methods
  async generateImage(prompt: string): Promise<string> {
    this.validateApiKey();
    this.validatePrompt(prompt);

    if (!this.model.includes('stable-diffusion')) {
      throw new Error('Current model does not support image generation');
    }

    try {
      const output = await this.client.run(
        this.model,
        {
          input: {
            prompt: this.sanitizePrompt(prompt)
          }
        }
      );

      if (Array.isArray(output) && typeof output[0] === 'string') {
        return output[0];
      }

      throw new Error('Failed to generate image');
    } catch (error: any) {
      this.handleError(error);
      throw error;
    }
  }

  async getPrediction(id: string): Promise<any> {
    try {
      const prediction = await this.client.predictions.get(id);
      return prediction;
    } catch (error: any) {
      this.handleError(error);
      throw error;
    }
  }

  async cancelPrediction(id: string): Promise<void> {
    try {
      await this.client.predictions.cancel(id);
    } catch (error: any) {
      this.handleError(error);
      throw error;
    }
  }

  setModel(modelId: ModelID): void {
    this.model = modelId;
  }

  // Helper method to determine if a model is an image model
  isImageModel(): boolean {
    return this.model.includes('stable-diffusion');
  }

  // Method to generate a liminal space image
  async generateLiminalSpace(
    description: string = 'A mysterious, empty hallway with flickering fluorescent lights'
  ): Promise<string> {
    const enhancedPrompt = `liminal space, ${description}, unsettling, eerie, backrooms aesthetic, empty, liminal, nostalgic, dreamlike quality, high quality, detailed, atmospheric`;
    
    return this.generateImage(enhancedPrompt);
  }

  // Method to create multiple variations of an image
  async generateVariations(
    prompt: string,
    count: number = 4
  ): Promise<string[]> {
    this.validateApiKey();
    this.validatePrompt(prompt);

    if (!this.isImageModel()) {
      throw new Error('Current model does not support image generation');
    }

    try {
      const results = await Promise.all(
        Array(count).fill(null).map(() =>
          this.client.run(
            this.model,
            {
              input: {
                prompt: this.sanitizePrompt(prompt),
                num_outputs: 1
              }
            }
          )
        )
      );

      return results.map(result => {
        if (Array.isArray(result) && typeof result[0] === 'string') {
          return result[0];
        }
        throw new Error('Unexpected output format from Replicate');
      });
    } catch (error: any) {
      this.handleError(error);
      throw error;
    }
  }
} 