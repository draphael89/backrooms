import { NextResponse } from 'next/server';
import { aiFactory } from '@/lib/ai';
import type { ReplicateProvider } from '@/lib/ai';

interface ImageRequest {
  prompt: string;
  variations?: number;
  enhancePrompt?: boolean;
}

interface ImageResponse {
  images: string[];
  error?: string;
}

// Type guard to check if a provider is a ReplicateProvider
function isReplicateProvider(provider: any): provider is ReplicateProvider {
  return (
    provider &&
    typeof provider.generateImage === 'function' &&
    typeof provider.generateLiminalSpace === 'function' &&
    typeof provider.generateVariations === 'function'
  );
}

export async function POST(req: Request) {
  try {
    const { prompt, variations = 1, enhancePrompt = true } = await req.json() as ImageRequest;

    // Validate input
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Valid prompt is required' },
        { status: 400 }
      );
    }

    // Get the Replicate provider
    const provider = aiFactory.getProvider('replicate');
    
    if (!isReplicateProvider(provider)) {
      throw new Error('Failed to initialize Replicate provider');
    }

    // Generate image(s)
    let images: string[];
    if (variations > 1) {
      images = await provider.generateVariations(
        enhancePrompt ? enhanceImagePrompt(prompt) : prompt,
        variations
      );
    } else {
      const image = await provider.generateLiminalSpace(prompt);
      images = [image];
    }

    const response: ImageResponse = { images };
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Image Generation API Error:', error);
    const errorResponse: ImageResponse = {
      images: [],
      error: error.message || 'Failed to generate image'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// Helper function to enhance prompts for liminal spaces
function enhanceImagePrompt(prompt: string): string {
  const basePrompts = [
    'liminal space',
    'backrooms aesthetic',
    'empty',
    'eerie',
    'unsettling',
    'dreamlike quality',
    'high quality',
    'detailed',
    'atmospheric',
    'abandoned',
    'fluorescent lighting',
    'liminal',
    'nostalgic',
    'uncanny',
    'cinematic',
    'wide angle'
  ];

  return `${prompt}, ${basePrompts.join(', ')}, trending on artstation, 8k uhd, high detail`;
}

// Helper function to validate prompt
function validatePrompt(prompt: string): boolean {
  return (
    typeof prompt === 'string' &&
    prompt.length > 0 &&
    prompt.length <= 500 // Maximum prompt length
  );
}

// Helper function to sanitize prompt
function sanitizePrompt(prompt: string): string {
  // Remove potentially problematic characters
  return prompt.replace(/[<>{}[\]\\]/g, '');
} 