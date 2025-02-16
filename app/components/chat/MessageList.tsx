'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Message } from './Message';
import type { Message as MessageType } from '@/lib/types';

interface Props {
  messages: MessageType[];
  onFork?: (messageId: string) => void;
  streamingContent?: string;
  className?: string;
}

export function MessageList({ 
  messages, 
  onFork, 
  streamingContent = '',
  className = '' 
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingContent, autoScroll]);

  // Handle scroll events to detect if user has scrolled up
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 50;
    setAutoScroll(isAtBottom);
  }, []);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`flex-1 overflow-y-auto p-4 space-y-4 ${className}`}
    >
      {messages.map((message) => (
        <Message
          key={message.id}
          message={message}
          onFork={onFork ? () => onFork(message.id) : undefined}
        />
      ))}

      {/* Streaming message */}
      {streamingContent && (
        <div className={`flex justify-start my-2`}>
          <div className={`
            max-w-[70%] rounded-lg p-3
            bg-gray-700 text-gray-100
            hover:shadow-lg transition-shadow duration-200
          `}>
            <p className="whitespace-pre-wrap break-words">
              {streamingContent}
              <span className="inline-block w-1 h-4 ml-1 bg-blue-500 animate-pulse" />
            </p>
          </div>
        </div>
      )}

      <div ref={bottomRef} className="h-px" />

      {/* New message indicator */}
      {!autoScroll && messages.length > 0 && (
        <button
          onClick={() => {
            setAutoScroll(true);
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors duration-200"
        >
          ↓ New message
        </button>
      )}
    </div>
  );
} 