'use client';

import { useState, useCallback } from 'react';
import type { ConversationBranch } from '@/lib/state/conversation';

interface Props {
  branches: ConversationBranch[];
  currentBranchId: string;
  onSwitchBranch: (branchId: string) => void;
  onDeleteBranch: (branchId: string) => void;
  onClearAll: () => void;
  className?: string;
}

export function BranchSelector({
  branches,
  currentBranchId,
  onSwitchBranch,
  onDeleteBranch,
  onClearAll,
  className = ''
}: Props) {
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const handleDelete = useCallback((branchId: string) => {
    setShowConfirmDelete(branchId);
  }, []);

  const handleConfirmDelete = useCallback((branchId: string) => {
    onDeleteBranch(branchId);
    setShowConfirmDelete(null);
  }, [onDeleteBranch]);

  const handleCancelDelete = useCallback(() => {
    setShowConfirmDelete(null);
  }, []);

  const handleClearAll = useCallback(() => {
    setShowConfirmClear(true);
  }, []);

  const handleConfirmClear = useCallback(() => {
    onClearAll();
    setShowConfirmClear(false);
  }, [onClearAll]);

  const handleCancelClear = useCallback(() => {
    setShowConfirmClear(false);
  }, []);

  return (
    <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Conversation Branches</h2>
        <button
          onClick={handleClearAll}
          className="text-sm text-red-500 hover:text-red-400 transition-colors"
        >
          Clear All
        </button>
      </div>

      <div className="space-y-2">
        {branches.map(branch => (
          <div
            key={branch.id}
            className={`
              p-3 rounded-lg transition-colors cursor-pointer
              ${branch.id === currentBranchId
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-100'
              }
            `}
          >
            <div className="flex justify-between items-start">
              <div
                className="flex-1 mr-2"
                onClick={() => onSwitchBranch(branch.id)}
              >
                <div className="font-medium">{branch.title}</div>
                <div className="text-sm opacity-75">
                  {new Date(branch.timestamp).toLocaleString()}
                </div>
              </div>
              {branch.id !== currentBranchId && (
                <button
                  onClick={() => handleDelete(branch.id)}
                  className="text-sm text-gray-400 hover:text-red-400 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>

            {showConfirmDelete === branch.id && (
              <div className="mt-2 flex items-center gap-2 text-sm">
                <span>Delete this branch?</span>
                <button
                  onClick={() => handleConfirmDelete(branch.id)}
                  className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                  Yes
                </button>
                <button
                  onClick={handleCancelDelete}
                  className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
                >
                  No
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Clear All Confirmation */}
      {showConfirmClear && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
          <p className="text-sm text-red-500 mb-2">
            Are you sure you want to clear all conversations? This cannot be undone.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleConfirmClear}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Yes, Clear All
            </button>
            <button
              onClick={handleCancelClear}
              className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 