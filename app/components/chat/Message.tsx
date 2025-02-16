'use client';

import { useState, useCallback } from 'react';
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
            <img 
              src={message.content} 
              alt="AI generated"
              className="rounded-md max-w-full h-auto"
              loading="lazy"
            />
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
            ...(onFork ? [{ label: 'Fork from here', action: handleFork }] : [])
          ]}
          onClose={() => setShowMenu(false)}
        />
      )}
    </div>
  );
} 