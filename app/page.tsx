'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ChatBubble } from '@/components/ui/ChatBubble';
import { Message } from '@/types';

const STORAGE_KEY = 'owlight_chat_messages';

export default function ChatPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'こんにちは！AIアシスタントです。何かお話ししましょう！' }
  ]);
  const [isSending, setIsSending] = useState(false);
  const isLoaded = useRef(false);

  // 会話履歴の復元 (マウント時)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMessages = localStorage.getItem(STORAGE_KEY);
      if (savedMessages) {
        try {
          setMessages(JSON.parse(savedMessages));
        } catch (e) {
          console.error("Failed to parse chat history:", e);
        }
      }
      isLoaded.current = true;
    }
  }, []);

  // 会話履歴の保存 (更新時)
  useEffect(() => {
    if (isLoaded.current && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    // 新しい履歴配列を作成 (これをそのままステート更新とAPI送信に使う)
    const newHistory = [...messages, userMessage];

    setMessages(newHistory);
    setInput('');
    setIsSending(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // メッセージ履歴全体を送信
        body: JSON.stringify({ messages: newHistory }),
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
