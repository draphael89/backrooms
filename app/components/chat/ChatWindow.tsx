'use client';

import { useState, useCallback, useRef } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { BranchSelector } from './BranchSelector';
import { useConversation } from '@/lib/hooks/useConversation';
import type { Message } from '@/lib/types';

interface Props {
  className?: string;
}

export function ChatWindow({ className = '' }: Props) {
  const {
    currentBranch,
    branches,
    updateMessages,
    fork,
    switchToBranch,
    removeBranch,
    clearAll
  } = useConversation();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // Clear any previous errors
    setError(null);

    // Check if this is an image generation command
    const isImageCommand = content.startsWith('/generate ');
    
    // Create user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      type: 'text',
      timestamp: Date.now()
    };

    const newMessages = [...currentBranch.messages, userMessage];
    updateMessages(newMessages);
    setIsLoading(true);
    setStreamingContent('');

    try {
      if (isImageCommand) {
        // Extract the prompt from the command
        const prompt = content.slice(10);
        
        // Call the image generation API
        const response = await fetch('/api/generate/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt })
        });

        if (!response.ok) {
          throw new Error('Failed to generate image');
        }

        const data = await response.json();
        if (!data.images?.[0]) {
          throw new Error('No image generated');
        }

        // Add the image message
        const imageMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.images[0],
          type: 'image',
          timestamp: Date.now()
        };

        updateMessages([...newMessages, imageMessage]);
      } else {
        // Create a new AbortController for this request
        abortControllerRef.current = new AbortController();

        // Start streaming response
        const response = await fetch('/api/chat/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: newMessages }),
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
                updateMessages([...newMessages, assistantMessage]);
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
      }
    } catch (error: any) {
      console.error('Failed to send message:', error);
      setError(error.message || 'Failed to send message. Please try again.');

      // Add error message
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: isImageCommand 
          ? 'Sorry, I failed to generate the image. Please try again.'
          : 'Sorry, something went wrong. Please try again.',
        type: 'text',
        timestamp: Date.now()
      };
      updateMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [currentBranch.messages, updateMessages]);

  const handleFork = useCallback((messageId: string) => {
    // Cancel any ongoing streaming
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      setStreamingContent('');
    }

    // Find the message and its index
    const messageIndex = currentBranch.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    // Create a new branch starting from this message
    const messages = currentBranch.messages.slice(0, messageIndex + 1);
    fork(messageId, messages);
  }, [currentBranch.messages, fork]);

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-4 gap-4 h-full ${className}`}>
      <div className="lg:col-span-3 flex flex-col bg-gray-900 rounded-lg overflow-hidden">
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-2 m-2 rounded">
            {error}
          </div>
        )}
        <MessageList
          messages={currentBranch.messages}
          onFork={handleFork}
          streamingContent={streamingContent}
          className="flex-1"
        />
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={isLoading}
          placeholder="Type a message or use /generate to create an image..."
          className="flex-shrink-0"
        />
      </div>

      <div className="hidden lg:block">
        <BranchSelector
          branches={branches}
          currentBranchId={currentBranch.id}
          onSwitchBranch={switchToBranch}
          onDeleteBranch={removeBranch}
          onClearAll={clearAll}
          className="h-full"
        />
      </div>
    </div>
  );
} 