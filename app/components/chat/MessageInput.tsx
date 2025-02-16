'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface Props {
  onSendMessage: (content: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function MessageInput({
  onSendMessage,
  disabled = false,
  placeholder = 'Type a message...',
  className = ''
}: Props) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!message.trim() || disabled || isSubmitting) return;

    setError(null);
    setIsSubmitting(true);
    try {
      await onSendMessage(message);
      setMessage('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error: any) {
      console.error('Failed to send message:', error);
      setError(error.message || 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [message, disabled, isSubmitting, onSendMessage]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  return (
    <form
      onSubmit={handleSubmit}
      className={`p-4 bg-gray-800 border-t border-gray-700 ${className}`}
    >
      {error && (
        <div className="mb-2 text-sm text-red-500">
          {error}
        </div>
      )}
      <div className="flex items-end gap-2 max-w-4xl mx-auto">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled || isSubmitting}
            className={`
              w-full px-4 py-2 bg-gray-700 text-white rounded-lg
              resize-none overflow-hidden min-h-[44px] max-h-[200px]
              focus:outline-none focus:ring-2 focus:ring-blue-500
              disabled:opacity-50 disabled:cursor-not-allowed
              placeholder-gray-400
              transition-all duration-200
              ${error ? 'ring-2 ring-red-500' : ''}
            `}
            rows={1}
          />
          {message.length > 0 && !isSubmitting && (
            <div className="absolute right-2 bottom-2 text-xs text-gray-400">
              Press Enter to send
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={!message.trim() || disabled || isSubmitting}
          className={`
            px-4 py-2 bg-blue-600 text-white rounded-lg
            hover:bg-blue-700 transition-colors duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            min-w-[80px]
            relative
            ${isSubmitting ? 'pl-8' : ''}
          `}
        >
          {isSubmitting && (
            <div className="absolute left-2 top-1/2 -mt-2 w-4 h-4">
              <div className="w-full h-full border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {isSubmitting ? 'Sending...' : 'Send'}
        </button>
      </div>
    </form>
  );
} 