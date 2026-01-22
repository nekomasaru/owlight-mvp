'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ChatBubble } from '@/components/ui/ChatBubble';
import { Message } from '@/types';

export default function ChatPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'こんにちは！何かお手伝いできることはありますか？' }
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

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '(ダミー回答) ご質問ありがとうございます。これはデモ用の固定回答です。',
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsSending(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}
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
