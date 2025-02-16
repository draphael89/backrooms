import type { Message } from '@/lib/types';
import type { ProviderType } from '@/lib/ai';

export interface ChatRequest {
  messages: Message[];
  provider?: ProviderType;
  options?: {
    maxTokens?: number;
    temperature?: number;
    streaming?: boolean;
  };
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  response: string;
  error?: string;
}

// Helper functions
export function validateMessages(messages: Message[]): boolean {
  if (!Array.isArray(messages) || messages.length === 0) {
    return false;
  }
  
  return messages.every(msg => 
    typeof msg === 'object' &&
    typeof msg.content === 'string' &&
    ['user', 'assistant', 'system'].includes(msg.role)
  );
}

export function sanitizeMessages(messages: Message[]): Message[] {
  return messages.map(msg => ({
    ...msg,
    content: msg.content.replace(/[<>{}[\]\\]/g, '')
  }));
}

export const SYSTEM_PROMPT = 'You are an AI assistant guiding users through the mysterious and eerie liminal backrooms. Maintain an atmosphere of subtle unease and mystery. Describe the environments in vivid detail, focusing on the strange and liminal aspects of the space.'; 