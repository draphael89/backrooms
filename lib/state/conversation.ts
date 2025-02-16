import type { Message } from '@/lib/types';

const STORAGE_KEY = 'liminal_backrooms_conversations';
const CURRENT_BRANCH_KEY = 'liminal_backrooms_current_branch';

interface ConversationBranch {
  id: string;
  messages: Message[];
  parentId?: string;
  timestamp: number;
  title: string;
}

interface ConversationState {
  branches: Record<string, ConversationBranch>;
  currentBranchId: string;
  lastUpdated: number;
}

// Initialize state from local storage
function loadState(): ConversationState {
  if (typeof window === 'undefined') return createInitialState();

  try {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (!savedState) return createInitialState();

    const state = JSON.parse(savedState) as ConversationState;
    return state;
  } catch (error) {
    console.error('Failed to load conversation state:', error);
    return createInitialState();
  }
}

// Save state to local storage
function saveState(state: ConversationState): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    localStorage.setItem(CURRENT_BRANCH_KEY, state.currentBranchId);
  } catch (error) {
    console.error('Failed to save conversation state:', error);
  }
}

// Create initial state with welcome message
function createInitialState(): ConversationState {
  const initialBranchId = crypto.randomUUID();
  return {
    branches: {
      [initialBranchId]: {
        id: initialBranchId,
        messages: [
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: 'Welcome to the Backrooms. What do you see around you?',
            type: 'text',
            timestamp: Date.now()
          }
        ],
        timestamp: Date.now(),
        title: 'Initial Conversation'
      }
    },
    currentBranchId: initialBranchId,
    lastUpdated: Date.now()
  };
}

// Get current conversation branch
export function getCurrentBranch(): ConversationBranch {
  const state = loadState();
  return state.branches[state.currentBranchId];
}

// Save messages to current branch
export function saveMessages(messages: Message[]): void {
  const state = loadState();
  const currentBranch = state.branches[state.currentBranchId];

  // Update branch
  state.branches[state.currentBranchId] = {
    ...currentBranch,
    messages,
    timestamp: Date.now()
  };

  state.lastUpdated = Date.now();
  saveState(state);
}

// Create a new branch from a message
export function createBranch(messageId: string, messages: Message[]): string {
  const state = loadState();
  const newBranchId = crypto.randomUUID();

  // Get the message content for the title
  const titleMessage = messages.find(m => m.id === messageId);
  const title = titleMessage 
    ? `Branch from: ${titleMessage.content.slice(0, 30)}...`
    : `Branch at ${new Date().toLocaleString()}`;

  // Create new branch
  state.branches[newBranchId] = {
    id: newBranchId,
    messages,
    parentId: state.currentBranchId,
    timestamp: Date.now(),
    title
  };

  // Update state
  state.currentBranchId = newBranchId;
  state.lastUpdated = Date.now();
  saveState(state);

  return newBranchId;
}

// Switch to a different branch
export function switchBranch(branchId: string): ConversationBranch {
  const state = loadState();
  if (!state.branches[branchId]) {
    throw new Error('Branch not found');
  }

  state.currentBranchId = branchId;
  state.lastUpdated = Date.now();
  saveState(state);

  return state.branches[branchId];
}

// Get all branches
export function getAllBranches(): ConversationBranch[] {
  const state = loadState();
  return Object.values(state.branches).sort((a, b) => b.timestamp - a.timestamp);
}

// Delete a branch
export function deleteBranch(branchId: string): void {
  const state = loadState();
  if (!state.branches[branchId]) {
    throw new Error('Branch not found');
  }

  // Can't delete the last branch
  if (Object.keys(state.branches).length === 1) {
    throw new Error('Cannot delete the last branch');
  }

  // If deleting current branch, switch to another one
  if (state.currentBranchId === branchId) {
    const otherBranchId = Object.keys(state.branches).find(id => id !== branchId);
    if (otherBranchId) {
      state.currentBranchId = otherBranchId;
    }
  }

  // Delete branch
  delete state.branches[branchId];
  state.lastUpdated = Date.now();
  saveState(state);
}

// Clear all conversation data
export function clearAllConversations(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(CURRENT_BRANCH_KEY);
}

// Export types
export type { ConversationBranch, ConversationState }; 