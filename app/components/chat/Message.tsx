'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import type { Message as MessageType } from '@/lib/types';
import { ContextMenu } from '../common/ContextMenu';

interface Props {
  message: MessageType;
  onFork?: () => void;
  className?: string;
}

export function Message({ message, onFork, className = '' }: Props) {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const isUser = message.role === 'user';

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setShowMenu(true);
    setMenuPosition({ x: e.clientX, y: e.clientY });
  }, []);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.content);
    setShowMenu(false);
  }, [message.content]);

  const handleFork = useCallback(() => {
    if (onFork) {
      onFork();
      setShowMenu(false);
    }
  }, [onFork]);

  const handleImageLoad = useCallback(() => {
    setImageLoading(false);
    setImageError(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageLoading(false);
    setImageError(true);
  }, []);

  const handleGenerateNewImage = useCallback(async () => {
    if (!message.content.startsWith('/generate')) return;
    
    try {
      const response = await fetch('/api/generate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: message.content.slice(10) })
      });

      if (!response.ok) throw new Error('Failed to generate image');

      const data = await response.json();
      if (data.images?.[0]) {
        // Update the message content with the new image URL
        // This would need to be handled by the parent component
        console.log('New image generated:', data.images[0]);
      }
    } catch (error) {
      console.error('Failed to generate new image:', error);
      setImageError(true);
    }
  }, [message.content]);

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} my-2 ${className}`}
      onContextMenu={handleContextMenu}
    >
      <div
        className={`
          max-w-[70%] rounded-lg p-3
          ${isUser ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-100'}
          hover:shadow-lg transition-shadow duration-200
          ${message.type === 'image' ? 'overflow-hidden' : ''}
        `}
      >
        {message.type === 'text' ? (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        ) : message.type === 'image' ? (
          <div className="relative">
            <div className="relative aspect-video w-full min-h-[200px] bg-gray-800 rounded overflow-hidden">
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {imageError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-sm text-gray-400">
                  <span>Failed to load image</span>
                  <button
                    onClick={handleGenerateNewImage}
                    className="mt-2 px-3 py-1 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <Image
                  src={message.content}
                  alt="AI generated"
                  className={`
                    rounded-md w-full h-full object-cover
                    transition-opacity duration-200
                    ${imageLoading ? 'opacity-0' : 'opacity-100'}
                  `}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  width={512}
                  height={512}
                  priority={false}
                />
              )}
            </div>
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-opacity duration-200" />
          </div>
        ) : null}

        {/* Message metadata */}
        <div className="mt-1 text-xs opacity-60 flex justify-between items-center">
          <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
          {message.model && (
            <span className="ml-2">{message.model}</span>
          )}
        </div>
      </div>

      {showMenu && (
        <ContextMenu
          position={menuPosition}
          options={[
            { label: 'Copy', action: handleCopy },
            ...(onFork ? [{ label: 'Fork from here', action: handleFork }] : []),
            ...(message.type === 'image' ? [{ label: 'Regenerate', action: handleGenerateNewImage }] : [])
          ]}
          onClose={() => setShowMenu(false)}
        />
      )}
    </div>
  );
} 