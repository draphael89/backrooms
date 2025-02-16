'use client';

import { useState, useCallback, useRef } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import type { Message } from '@/lib/types';

interface Props {
  initialMessages?: Message[];
  onSendMessage?: (content: string) => Promise<void>;
  onFork?: (messageId: string) => void;
  className?: string;
}

export function ChatWindow({
  initialMessages = [],
  onSendMessage,
  onFork,
  className = ''
}: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // Clear any previous errors
    setError(null);

    // Create user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      type: 'text',
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setStreamingContent('');

    // Create a new AbortController for this request
    abortControllerRef.current = new AbortController();

    try {
      // Start streaming response
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      // Read the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              // End of stream, add the complete message
              const assistantMessage: Message = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: streamingContent,
                type: 'text',
                timestamp: Date.now()
              };
              setMessages(prev => [...prev, assistantMessage]);
              setStreamingContent('');
              break;
            }

            try {
              const { text } = JSON.parse(data);
              setStreamingContent(prev => prev + text);
            } catch (e) {
              console.error('Failed to parse chunk:', data);
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Failed to send message:', error);
      setError(error.message || 'Failed to send message. Please try again.');

      // Add error message
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        type: 'text',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [messages]);

  const handleFork = useCallback((messageId: string) => {
    // Cancel any ongoing streaming
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      setStreamingContent('');
    }

    if (onFork) {
      onFork(messageId);
    }
  }, [onFork]);

  return (
    <div className={`flex flex-col h-full bg-gray-900 ${className}`}>
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-2 mb-2 rounded">
          {error}
        </div>
      )}
      <MessageList
        messages={messages}
        onFork={onFork ? handleFork : undefined}
        streamingContent={streamingContent}
        className="flex-1"
      />
      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={isLoading}
        className="flex-shrink-0"
      />
    </div>
  );
} 