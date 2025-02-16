'use client';

import { useEffect, useRef } from 'react';

interface MenuOption {
  label: string;
  action: () => void;
}

interface Props {
  position: { x: number; y: number };
  options: MenuOption[];
  onClose: () => void;
}

export function ContextMenu({ position, options, onClose }: Props) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position to keep menu in viewport
  const adjustedPosition = {
    x: Math.min(position.x, window.innerWidth - (menuRef.current?.offsetWidth || 200)),
    y: Math.min(position.y, window.innerHeight - (menuRef.current?.offsetHeight || 200))
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-1 min-w-[160px]"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y
      }}
    >
      {options.map((option, index) => (
        <button
          key={index}
          onClick={option.action}
          className="w-full px-4 py-2 text-left text-gray-200 hover:bg-gray-700 transition-colors duration-150"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
} 