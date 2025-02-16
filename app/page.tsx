'use client';

import { useState, useMemo } from 'react';
import { ChatWindow } from './components/chat';
import { NetworkGraph } from './components/visualization';
import type { Message, Node, Link } from '@/lib/types';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: 'Welcome to the Backrooms. What do you see around you?',
      type: 'text',
      timestamp: Date.now()
    }
  ]);

  // Convert messages to graph nodes and links
  const { nodes, links } = useMemo(() => {
    const nodes: Node[] = messages.map(msg => ({
      id: msg.id,
      label: msg.role === 'user' ? 'You' : 'AI',
      type: 'message',
      content: msg.content,
      current: msg.id === messages[messages.length - 1].id
    }));

    const links: Link[] = messages.slice(1).map((msg, index) => ({
      source: messages[index].id,
      target: msg.id,
      label: ''
    }));

    return { nodes, links };
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [
            ...messages,
            { role: 'user', content, type: 'text', timestamp: Date.now() }
          ]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      // Add the assistant's response
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.response,
          type: 'text',
          timestamp: Date.now()
        }
      ]);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Handle error (could show an error message to the user)
    }
  };

  const handleFork = (messageId: string) => {
    // Find the message and its index
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    // Create a new branch starting from this message
    const newMessages = messages.slice(0, messageIndex + 1);
    setMessages(newMessages);
  };

  const handleNodeClick = (node: Node) => {
    handleFork(node.id);
  };

  return (
    <main className="flex min-h-screen flex-col bg-gray-950 text-gray-100">
      <header className="p-4 bg-gray-900 border-b border-gray-800">
        <h1 className="text-xl font-semibold text-center">Liminal Backrooms</h1>
      </header>
      
      <div className="flex-1 container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-8rem)]">
          {/* Chat interface */}
          <div className="lg:col-span-2">
            <ChatWindow
              initialMessages={messages}
              onSendMessage={handleSendMessage}
              onFork={handleFork}
              className="h-full"
            />
          </div>

          {/* Network visualization */}
          <div className="hidden lg:block">
            <div className="bg-gray-900 rounded-lg p-4 h-full">
              <h2 className="text-lg font-medium mb-4">Conversation Map</h2>
              <NetworkGraph
                nodes={nodes}
                links={links}
                onNodeClick={handleNodeClick}
                className="h-[calc(100%-2rem)]"
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
