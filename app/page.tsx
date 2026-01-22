'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ChatBubble } from '@/components/ui/ChatBubble';
import { Message } from '@/types';

export default function ChatPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'こんにちは！AIアシスタントです。何かお話ししましょう！' }
  ]);
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsSending(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || 'すみません、うまく回答できませんでした。',
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'エラーが発生しました。もう一度試してみてください。',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}
        {isSending && (
          <div className="flex w-full justify-start mb-4">
            <div className="bg-white border border-gray-100 text-gray-500 rounded-2xl rounded-tl-none px-5 py-3 shadow-sm text-sm">
              考え中...
            </div>
          </div>
        )}
      </div>
      <div className="p-4 bg-white/50 backdrop-blur-sm rounded-t-2xl border-t border-white/20">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="メッセージを入力..."
            disabled={isSending}
            className="flex-grow"
          />
          <Button type="submit" disabled={isSending}>
            {isSending ? '送信中...' : '送信'}
          </Button>
        </form>
      </div>
    </div>
  );
}
