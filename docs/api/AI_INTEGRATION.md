# AI Integration Guide

This guide details the integration of various AI services (Anthropic Claude, OpenRouter, Replicate, DeepSeek) into the Liminal Backrooms application.

## Overview

The application uses multiple AI models for different purposes:
- **Anthropic Claude**: Primary conversation model
- **OpenRouter**: Model fallback and alternative providers
- **Replicate**: Image generation and specialized models
- **DeepSeek**: Complex reasoning tasks

## Implementation

### 1. Base AI Provider Interface

```typescript
// lib/ai/types.ts
export interface AIProvider {
  generate(prompt: string): Promise<string>;
  stream(prompt: string): AsyncGenerator<string, void, unknown>;
  handleError(error: Error): void;
  getCapabilities(): string[];
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
}

export interface AIResponse {
  content: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
```

### 2. Anthropic Claude Integration

```typescript
// lib/ai/claude.ts
import { Anthropic } from '@anthropic-ai/sdk';
import { AIProvider, AIMessage, AIResponse } from './types';

export class ClaudeProvider implements AIProvider {
  private client: Anthropic;
  
  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!
    });
  }

  async generate(prompt: string): Promise<string> {
    try {
      const response = await this.client.messages.create({
        model: 'claude-3',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      });
      return response.content[0].text;
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }

  async *stream(prompt: string): AsyncGenerator<string, void, unknown> {
    const stream = await this.client.messages.create({
      model: 'claude-3',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
      stream: true
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta') {
        yield chunk.delta.text;
      }
    }
  }

  handleError(error: Error): void {
    console.error('Claude API Error:', error);
    // Implement error handling strategy
  }

  getCapabilities(): string[] {
    return ['text', 'analysis', 'conversation'];
  }
}
```

### 3. OpenRouter Integration

```typescript
// lib/ai/openrouter.ts
import { AIProvider } from './types';

export class OpenRouterProvider implements AIProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY!;
    this.baseUrl = 'https://openrouter.ai/api/v1';
  }

  async generate(prompt: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'openai/gpt-4',
          messages: [{ role: 'user', content: prompt }]
        })
      });

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }

  // Implement other interface methods...
}
```

### 4. Replicate Integration

```typescript
// lib/ai/replicate.ts
import Replicate from 'replicate';
import { AIProvider } from './types';

export class ReplicateProvider implements AIProvider {
  private client: Replicate;

  constructor() {
    this.client = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN!
    });
  }

  async generate(prompt: string): Promise<string> {
    try {
      const output = await this.client.run(
        "stability-ai/stable-diffusion:27b93a2413e7f36cd83da926f3656280b2931564ff050bf9575f1fdf9bcd7478",
        {
          input: {
            prompt: prompt
          }
        }
      );
      return output as string;
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }

  // Implement other interface methods...
}
```

### 5. AI Service Factory

```typescript
// lib/ai/factory.ts
import { AIProvider } from './types';
import { ClaudeProvider } from './claude';
import { OpenRouterProvider } from './openrouter';
import { ReplicateProvider } from './replicate';

export class AIFactory {
  static createProvider(type: 'claude' | 'openrouter' | 'replicate'): AIProvider {
    switch (type) {
      case 'claude':
        return new ClaudeProvider();
      case 'openrouter':
        return new OpenRouterProvider();
      case 'replicate':
        return new ReplicateProvider();
      default:
        throw new Error(`Unknown provider type: ${type}`);
    }
  }
}
```

### 6. API Route Implementation

```typescript
// app/api/chat/route.ts
import { NextResponse } from 'next/server';
import { AIFactory } from '@/lib/ai/factory';

export async function POST(req: Request) {
  try {
    const { prompt, provider = 'claude' } = await req.json();
    const aiProvider = AIFactory.createProvider(provider);
    
    const response = await aiProvider.generate(prompt);
    
    return NextResponse.json({ response });
  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}
```

## Usage Examples

### 1. Basic Conversation

```typescript
// app/components/Chat.tsx
import { useState } from 'react';

export function Chat() {
  const [messages, setMessages] = useState<AIMessage[]>([]);

  async function handleSubmit(prompt: string) {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, provider: 'claude' })
      });
      
      const data = await response.json();
      setMessages(prev => [...prev, 
        { role: 'user', content: prompt },
        { role: 'assistant', content: data.response }
      ]);
    } catch (error) {
      console.error('Chat Error:', error);
    }
  }

  // Render chat interface...
}
```

### 2. Streaming Responses

```typescript
// app/components/StreamingChat.tsx
import { useState, useEffect } from 'react';

export function StreamingChat() {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [streaming, setStreaming] = useState('');

  async function handleStream(prompt: string) {
    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      const reader = response.body?.getReader();
      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const text = new TextDecoder().decode(value);
        setStreaming(prev => prev + text);
      }

      setMessages(prev => [...prev,
        { role: 'assistant', content: streaming }
      ]);
      setStreaming('');
    } catch (error) {
      console.error('Streaming Error:', error);
    }
  }

  // Render streaming chat interface...
}
```

## Error Handling

### 1. Rate Limiting

```typescript
// lib/ai/rateLimit.ts
export class RateLimiter {
  private requests: number = 0;
  private lastReset: number = Date.now();
  private limit: number = 50; // requests per minute
  
  canMakeRequest(): boolean {
    const now = Date.now();
    if (now - this.lastReset >= 60000) {
      this.requests = 0;
      this.lastReset = now;
    }
    
    return this.requests < this.limit;
  }
  
  incrementRequests(): void {
    this.requests++;
  }
}
```

### 2. Fallback Strategy

```typescript
// lib/ai/fallback.ts
export async function withFallback(
  prompt: string,
  providers: AIProvider[]
): Promise<string> {
  for (const provider of providers) {
    try {
      return await provider.generate(prompt);
    } catch (error) {
      console.error(`Provider failed: ${provider.constructor.name}`, error);
      continue;
    }
  }
  throw new Error('All providers failed');
}
```

## Security Considerations

1. **API Key Protection**
   - Store keys in environment variables
   - Never expose keys in client-side code
   - Rotate keys regularly

2. **Input Validation**
   ```typescript
   function sanitizePrompt(prompt: string): string {
     // Remove potential harmful content
     return prompt.replace(/[<>]/g, '');
   }
   ```

3. **Rate Limiting**
   - Implement per-user limits
   - Use token bucket algorithm
   - Monitor usage patterns

## Testing

```typescript
// __tests__/ai/claude.test.ts
import { ClaudeProvider } from '@/lib/ai/claude';

describe('ClaudeProvider', () => {
  let provider: ClaudeProvider;

  beforeEach(() => {
    provider = new ClaudeProvider();
  });

  test('generates response', async () => {
    const response = await provider.generate('Test prompt');
    expect(response).toBeTruthy();
  });

  test('handles errors', async () => {
    // Test error scenarios
  });
});
```

## Monitoring and Logging

```typescript
// lib/ai/monitoring.ts
export class AIMonitoring {
  static logRequest(provider: string, prompt: string): void {
    // Log to monitoring service
    console.log(`AI Request: ${provider}`, {
      timestamp: new Date(),
      prompt_length: prompt.length
    });
  }

  static logError(provider: string, error: Error): void {
    // Log to error tracking service
    console.error(`AI Error: ${provider}`, {
      timestamp: new Date(),
      error: error.message
    });
  }
}
```

## Best Practices

1. **Prompt Engineering**
   - Use clear, consistent prompts
   - Include system messages for context
   - Handle edge cases

2. **Performance**
   - Implement caching where appropriate
   - Use streaming for long responses
   - Monitor token usage

3. **Error Recovery**
   - Implement retry logic
   - Use fallback providers
   - Log errors for debugging

4. **Testing**
   - Unit test provider implementations
   - Integration test API routes
   - Mock AI responses in tests
</rewritten_file> 