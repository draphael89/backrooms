# Component Guide

This guide details the React components used in the Liminal Backrooms application, their implementation, and best practices.

## Component Architecture

### Directory Structure

```
app/components/
├── chat/
│   ├── ChatWindow.tsx
│   ├── MessageList.tsx
│   ├── MessageInput.tsx
│   └── Message.tsx
├── visualization/
│   ├── NetworkGraph.tsx
│   ├── GraphNode.tsx
│   └── GraphControls.tsx
├── common/
│   ├── Button.tsx
│   ├── Input.tsx
│   └── Loading.tsx
└── layout/
    ├── Header.tsx
    └── Sidebar.tsx
```

## Core Components

### 1. Chat Components

#### ChatWindow

The main container for the chat interface.

```typescript
// app/components/chat/ChatWindow.tsx
import { useState } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import type { Message } from '@/lib/types';

export function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSendMessage(content: string) {
    setLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: content })
      });
      const data = await response.json();
      
      setMessages(prev => [...prev, 
        { role: 'user', content },
        { role: 'assistant', content: data.response }
      ]);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-900">
      <MessageList messages={messages} />
      <MessageInput 
        onSendMessage={handleSendMessage}
        disabled={loading}
      />
    </div>
  );
}
```

#### MessageList

Displays the conversation history.

```typescript
// app/components/chat/MessageList.tsx
import { useEffect, useRef } from 'react';
import { Message } from './Message';
import type { Message as MessageType } from '@/lib/types';

interface Props {
  messages: MessageType[];
}

export function MessageList({ messages }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message, index) => (
        <Message key={index} message={message} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
```

#### Message

Individual message component with support for different types.

```typescript
// app/components/chat/Message.tsx
import { useState } from 'react';
import type { Message as MessageType } from '@/lib/types';
import { ContextMenu } from '../common/ContextMenu';

interface Props {
  message: MessageType;
}

export function Message({ message }: Props) {
  const [showMenu, setShowMenu] = useState(false);
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
      onContextMenu={(e) => {
        e.preventDefault();
        setShowMenu(true);
      }}
    >
      <div
        className={`
          max-w-[70%] rounded-lg p-3
          ${isUser ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-100'}
        `}
      >
        {message.type === 'text' ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : message.type === 'image' ? (
          <img 
            src={message.content} 
            alt="AI generated"
            className="rounded-md max-w-full"
          />
        ) : null}
      </div>
      
      {showMenu && (
        <ContextMenu
          options={[
            { label: 'Copy', action: () => navigator.clipboard.writeText(message.content) },
            { label: 'Fork from here', action: () => {/* Implement fork logic */} }
          ]}
          onClose={() => setShowMenu(false)}
        />
      )}
    </div>
  );
}
```

### 2. Visualization Components

#### NetworkGraph

Displays the conversation branch network using D3.js.

```typescript
// app/components/visualization/NetworkGraph.tsx
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { Node, Link } from '@/lib/types';

interface Props {
  nodes: Node[];
  links: Link[];
  onNodeClick?: (node: Node) => void;
}

export function NetworkGraph({ nodes, links, onNodeClick }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = 600;
    const height = 400;

    // Clear previous graph
    svg.selectAll('*').remove();

    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id))
      .force('charge', d3.forceManyBody().strength(-100))
      .force('center', d3.forceCenter(width / 2, height / 2));

    // Draw links
    const link = svg
      .append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6);

    // Draw nodes
    const node = svg
      .append('g')
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', 5)
      .attr('fill', d => d.current ? '#4CAF50' : '#1E88E5')
      .call(drag(simulation));

    // Add node labels
    const labels = svg
      .append('g')
      .selectAll('text')
      .data(nodes)
      .join('text')
      .text(d => d.label)
      .attr('dx', 8)
      .attr('dy', 3)
      .style('font-size', '10px')
      .style('fill', '#fff');

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);

      labels
        .attr('x', d => d.x)
        .attr('y', d => d.y);
    });

    // Cleanup
    return () => simulation.stop();
  }, [nodes, links]);

  return (
    <div className="w-full h-full bg-gray-800 rounded-lg overflow-hidden">
      <svg
        ref={svgRef}
        viewBox="0 0 600 400"
        className="w-full h-full"
      />
    </div>
  );
}

// Drag behavior
function drag(simulation: d3.Simulation<any, undefined>) {
  function dragstarted(event: any) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }

  function dragged(event: any) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }

  function dragended(event: any) {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }

  return d3.drag()
    .on('start', dragstarted)
    .on('drag', dragged)
    .on('end', dragended);
}
```

### 3. Common Components

#### Button

Reusable button component with variants.

```typescript
// app/components/common/Button.tsx
import { ButtonHTMLAttributes } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ 
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: Props) {
  const baseStyles = 'rounded-lg font-medium transition-colors focus:outline-none focus:ring-2';
  
  const variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white'
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
```

#### Loading

Loading spinner component.

```typescript
// app/components/common/Loading.tsx
interface Props {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export function Loading({ size = 'md', color = 'currentColor' }: Props) {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`${sizeMap[size]} animate-spin`}>
      <svg
        className="w-full h-full"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke={color}
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill={color}
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
}
```

## Component Best Practices

### 1. Performance Optimization

```typescript
// Use React.memo for expensive renders
const ExpensiveComponent = React.memo(function ExpensiveComponent({ data }: Props) {
  // Component logic
});

// Use useMemo for expensive computations
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);

// Use useCallback for function props
const memoizedCallback = useCallback(
  () => {
    doSomething(a, b);
  },
  [a, b],
);
```

### 2. Error Boundaries

```typescript
// app/components/common/ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-red-100 text-red-900 rounded-lg">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 3. Accessibility

```typescript
// Keyboard navigation
function NavigableComponent() {
  const handleKeyPress = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Enter':
        // Handle enter
        break;
      case 'Escape':
        // Handle escape
        break;
      // Add more cases
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyPress={handleKeyPress}
      aria-label="Description"
    >
      Content
    </div>
  );
}
```

### 4. Testing Components

```typescript
// __tests__/components/Button.test.tsx
import { render, fireEvent } from '@testing-library/react';
import { Button } from '@/components/common/Button';

describe('Button', () => {
  it('renders children correctly', () => {
    const { getByText } = render(<Button>Click me</Button>);
    expect(getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    const { getByRole } = render(
      <Button onClick={handleClick}>Click me</Button>
    );
    fireEvent.click(getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## Component Documentation

Use JSDoc comments for component documentation:

```typescript
/**
 * Button component with different variants and sizes.
 * @component
 * @example
 * ```tsx
 * <Button variant="primary" size="md" onClick={() => {}}>
 *   Click me
 * </Button>
 * ```
 */
export function Button({ variant = 'primary', size = 'md', ...props }: Props) {
  // Component implementation
}
```

## State Management

### 1. Local State

```typescript
function LocalStateComponent() {
  const [count, setCount] = useState(0);
  
  return (
    <button onClick={() => setCount(prev => prev + 1)}>
      Count: {count}
    </button>
  );
}
```

### 2. Context

```typescript
// app/context/ChatContext.tsx
import { createContext, useContext, useReducer } from 'react';

interface ChatState {
  messages: Message[];
  loading: boolean;
}

const ChatContext = createContext<{
  state: ChatState;
  dispatch: React.Dispatch<ChatAction>;
} | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  
  return (
    <ChatContext.Provider value={{ state, dispatch }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
```

## Styling Guidelines

### 1. Tailwind CSS Classes

```typescript
// Consistent class ordering
const className = clsx(
  // Layout
  'flex flex-col',
  // Spacing
  'p-4 gap-2',
  // Typography
  'text-lg font-medium',
  // Colors
  'bg-gray-800 text-white',
  // States
  'hover:bg-gray-700',
  // Responsive
  'md:flex-row lg:p-6'
);
```

### 2. CSS Modules (if needed)

```typescript
// Button.module.css
.button {
  /* Base styles */
}

.primary {
  /* Primary variant */
}

// Button.tsx
import styles from './Button.module.css';

export function Button({ variant }: Props) {
  return (
    <button className={`${styles.button} ${styles[variant]}`}>
      Click me
    </button>
  );
}
```

## Component Lifecycle

### 1. Mounting

```typescript
function MountingComponent() {
  useEffect(() => {
    // Setup
    return () => {
      // Cleanup
    };
  }, []);
}
```

### 2. Updates

```typescript
function UpdatingComponent({ data }: Props) {
  useEffect(() => {
    // Handle data changes
  }, [data]);
}
```

## Optimization Techniques

### 1. Code Splitting

```typescript
const DynamicComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Loading />,
  ssr: false
});
```

### 2. Lazy Loading

```typescript
const LazyComponent = lazy(() => import('./LazyComponent'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <LazyComponent />
    </Suspense>
  );
}
```

## Component Communication

### 1. Props

```typescript
interface ChildProps {
  onAction: (data: any) => void;
}

function Child({ onAction }: ChildProps) {
  return <button onClick={() => onAction(data)}>Action</button>;
}

function Parent() {
  const handleAction = (data: any) => {
    // Handle action
  };

  return <Child onAction={handleAction} />;
}
```

### 2. Events

```typescript
function EventComponent() {
  useEffect(() => {
    const handler = (event: CustomEvent) => {
      // Handle custom event
    };

    window.addEventListener('custom-event', handler);
    return () => window.removeEventListener('custom-event', handler);
  }, []);
}
``` 