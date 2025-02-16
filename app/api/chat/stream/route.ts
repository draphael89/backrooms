import { NextResponse } from 'next/server';
import { aiFactory } from '@/lib/ai';
import { 
  ChatRequest, 
  ChatResponse, 
  validateMessages,
  SYSTEM_PROMPT
} from '../../types';

export async function POST(req: Request) {
  try {
    const { messages, provider = 'claude', options = {} } = await req.json() as ChatRequest;

    // Validate input
    if (!validateMessages(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    // Get the AI provider
    const aiProvider = aiFactory.getProviderWithFallback(
      provider,
      'claude',
      { ...options, streaming: true }
    );

    // Create a stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const encoder = new TextEncoder();

          // Get the last user message and add system context
          const lastMessage = messages[messages.length - 1];
          const prompt = `${SYSTEM_PROMPT}\n\nUser: ${lastMessage.content}\n\nAssistant:`;
          
          // Stream the response
          for await (const chunk of aiProvider.stream(prompt)) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Chat Streaming API Error:', error);
    const errorResponse: ChatResponse = {
      response: '',
      error: error.message || 'Failed to generate streaming response'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
} 