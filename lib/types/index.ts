// Message Types
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  type: 'text' | 'image';
  timestamp: number;
  model?: string;
  parentId?: string;
}

// AI Provider Types
export interface AIProvider {
  generate(prompt: string): Promise<string>;
  stream(prompt: string): AsyncGenerator<string, void, unknown>;
  handleError(error: Error): void;
  getCapabilities(): string[];
  generateWithHistory(messages: Message[]): Promise<string>;
}

export interface AIResponse {
  content: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Graph Visualization Types
export interface Node {
  id: string;
  label: string;
  type: 'message' | 'choice';
  content: string;
  current?: boolean;
}

export interface Link {
  source: string;
  target: string;
  label?: string;
}

export interface Graph {
  nodes: Node[];
  links: Link[];
}

// State Types
export interface ConversationState {
  messages: Message[];
  currentBranch: string;
  branches: Record<string, Message[]>;
  loading: boolean;
  error?: string;
}

export interface UIState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  visualizationVisible: boolean;
}

// Action Types
export type ConversationAction =
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'CREATE_BRANCH'; payload: { id: string; messages: Message[] } }
  | { type: 'SWITCH_BRANCH'; payload: string }
  | { type: 'CLEAR_CONVERSATION' };

export type UIAction =
  | { type: 'TOGGLE_THEME' }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'TOGGLE_VISUALIZATION' };

// Configuration Types
export interface AIConfig {
  maxTokens: number;
  temperature: number;
  defaultModel: string;
}

export interface AppConfig {
  ai: AIConfig;
  features: {
    imageGeneration: boolean;
    streaming: boolean;
    branching: boolean;
  };
}

// Component Props Types
export interface ChatWindowProps {
  onSendMessage: (content: string) => Promise<void>;
  className?: string;
}

export interface MessageProps {
  message: Message;
  onFork?: () => void;
  className?: string;
}

export interface NetworkGraphProps {
  data: Graph;
  onNodeClick?: (node: Node) => void;
  width?: number;
  height?: number;
  className?: string;
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type AsyncReturnType<T extends (...args: any) => Promise<any>> =
  T extends (...args: any) => Promise<infer R> ? R : any; 