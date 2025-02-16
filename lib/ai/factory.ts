import { AIProvider, AIProviderOptions } from './base';
import { ClaudeProvider } from './claude';
import { OpenRouterProvider } from './openrouter';
import { ReplicateProvider } from './replicate';

export type ProviderType = 'claude' | 'openrouter' | 'replicate';

export class AIFactory {
  private static instance: AIFactory;
  private providers: Map<ProviderType, AIProvider>;

  private constructor() {
    this.providers = new Map();
  }

  static getInstance(): AIFactory {
    if (!AIFactory.instance) {
      AIFactory.instance = new AIFactory();
    }
    return AIFactory.instance;
  }

  getProvider(type: ProviderType, options?: AIProviderOptions): AIProvider {
    if (!this.providers.has(type)) {
      this.providers.set(type, this.createProvider(type, options));
    }
    return this.providers.get(type)!;
  }

  private createProvider(type: ProviderType, options?: AIProviderOptions): AIProvider {
    switch (type) {
      case 'claude':
        return new ClaudeProvider(process.env.ANTHROPIC_API_KEY, options);
      case 'openrouter':
        return new OpenRouterProvider(process.env.OPENROUTER_API_KEY, options);
      case 'replicate':
        return new ReplicateProvider(process.env.REPLICATE_API_TOKEN, options);
      default:
        throw new Error(`Unknown provider type: ${type}`);
    }
  }

  // Helper method to get the best available provider
  getBestProvider(capabilities: string[]): AIProvider {
    for (const [type, provider] of this.providers.entries()) {
      const providerCapabilities = provider.getCapabilities();
      if (capabilities.every(cap => providerCapabilities.includes(cap))) {
        return provider;
      }
    }

    // If no provider matches all capabilities, try to find one that matches any
    for (const [type, provider] of this.providers.entries()) {
      const providerCapabilities = provider.getCapabilities();
      if (capabilities.some(cap => providerCapabilities.includes(cap))) {
        return provider;
      }
    }

    // Default to Claude if no match found
    return this.getProvider('claude');
  }

  // Method to initialize all providers
  initializeAll(options?: AIProviderOptions): void {
    this.getProvider('claude', options);
    this.getProvider('openrouter', options);
    this.getProvider('replicate', options);
  }

  // Method to get a provider with fallback
  getProviderWithFallback(
    primaryType: ProviderType,
    fallbackType: ProviderType,
    options?: AIProviderOptions
  ): AIProvider {
    try {
      return this.getProvider(primaryType, options);
    } catch (error) {
      console.warn(`Failed to get primary provider ${primaryType}, falling back to ${fallbackType}`);
      return this.getProvider(fallbackType, options);
    }
  }

  // Method to clear provider instances
  clearProviders(): void {
    this.providers.clear();
  }

  // Method to check if a provider is available
  isProviderAvailable(type: ProviderType): boolean {
    try {
      const provider = this.getProvider(type);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Method to get all available provider types
  getAvailableProviders(): ProviderType[] {
    return Array.from(this.providers.keys());
  }

  // Method to get provider capabilities
  getProviderCapabilities(type: ProviderType): string[] {
    const provider = this.getProvider(type);
    return provider.getCapabilities();
  }
}

// Export a singleton instance
export const aiFactory = AIFactory.getInstance(); 