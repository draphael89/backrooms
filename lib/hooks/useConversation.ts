import { useState, useEffect, useCallback } from 'react';
import type { Message } from '@/lib/types';
import {
  getCurrentBranch,
  saveMessages,
  createBranch,
  switchBranch,
  getAllBranches,
  deleteBranch,
  clearAllConversations,
  type ConversationBranch
} from '../state/conversation';

export function useConversation() {
  const [currentBranch, setCurrentBranch] = useState<ConversationBranch>(() => getCurrentBranch());
  const [branches, setBranches] = useState<ConversationBranch[]>(() => getAllBranches());

  // Update branches list when current branch changes
  useEffect(() => {
    setBranches(getAllBranches());
  }, [currentBranch]);

  // Save messages to current branch
  const updateMessages = useCallback((messages: Message[]) => {
    saveMessages(messages);
    setCurrentBranch(getCurrentBranch());
  }, []);

  // Create a new branch from a message
  const fork = useCallback((messageId: string, messages: Message[]) => {
    const newBranchId = createBranch(messageId, messages);
    setCurrentBranch(getCurrentBranch());
    return newBranchId;
  }, []);

  // Switch to a different branch
  const switchToBranch = useCallback((branchId: string) => {
    const branch = switchBranch(branchId);
    setCurrentBranch(branch);
  }, []);

  // Delete a branch
  const removeBranch = useCallback((branchId: string) => {
    deleteBranch(branchId);
    setCurrentBranch(getCurrentBranch());
  }, []);

  // Clear all conversations
  const clearAll = useCallback(() => {
    clearAllConversations();
    setCurrentBranch(getCurrentBranch());
  }, []);

  return {
    currentBranch,
    branches,
    updateMessages,
    fork,
    switchToBranch,
    removeBranch,
    clearAll
  };
} 