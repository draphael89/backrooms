'use client';

import { ChatWindow } from './components/chat';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-gray-950 text-gray-100">
      <header className="p-4 bg-gray-900 border-b border-gray-800">
        <h1 className="text-xl font-semibold text-center">Liminal Backrooms</h1>
      </header>
      
      <div className="flex-1 container mx-auto p-4">
        <ChatWindow className="h-[calc(100vh-8rem)]" />
      </div>
    </main>
  );
}
