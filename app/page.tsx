'use client';

import { useState, useEffect, useRef } from 'react';
import { Message } from '@/types';
import Link from 'next/link';
import { BookOpen, FolderOpen, Send, Sparkles, User, Settings } from 'lucide-react';

// --- Simple Components (SaaS Style) ---

const Button = ({ children, variant = "primary", className = "", ...props }: any) => {
  const baseStyle = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 shadow-sm active:scale-95";
  const variants = {
    primary: "bg-terracotta text-white hover:bg-terracotta/90",
    secondary: "bg-white text-taupe border border-slate-200 hover:bg-slate-50 hover:text-terracotta",
    ghost: "hover:bg-slate-100 text-taupe-light hover:text-terracotta transition-colors shadow-none",
    outline: "border border-slate-200 bg-transparent hover:bg-slate-100 text-taupe shadow-none"
  };
  return (
    <button className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className}`} {...props}>
      {children}
    </button>
  );
};

const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`rounded-xl border border-slate-200 bg-white text-taupe shadow-sm ${className}`}>
    {children}
  </div>
);

const ChatMessage = ({ message }: { message: Message }) => {
  const isUser = message.role === 'user';
  return (
    <div className={`flex w-full mb-8 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 mr-4">
          <div className="h-10 w-10 rounded-full border-2 border-sage overflow-hidden shadow-sm bg-white">
            <img src="/Mr.OWL.jpg" alt="AI" className="w-full h-full object-cover" />
          </div>
        </div>
      )}
      <div className={`max-w-[85%] ${isUser ? '' : 'pt-2'}`}>
        {isUser ? (
          <div className="bg-terracotta text-white px-5 py-3 rounded-2xl rounded-tr-sm text-sm font-medium shadow-sm leading-relaxed">
            {message.content}
          </div>
        ) : (
          <div className="text-taupe text-sm leading-7 whitespace-pre-wrap font-medium">
            {message.content}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main Page ---

export default function SaaSPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'こんにちは。OWLight AIです。\n業務に関する質問や、マニュアルの検索をサポートします。🦉' }
  ]);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // History Logic
  useEffect(() => {
    const saved = localStorage.getItem('chat_history');
    if (saved) {
      try { setMessages(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('chat_history', JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsSending(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || "Error: No response.",
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: "エラーが発生しました。" }]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">

      {/* SaaS Navbar with Brand Identity */}
      <header className="sticky top-0 z-10 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 h-14 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full border border-terracotta overflow-hidden shadow-sm">
            <img src="/Mr.OWL.jpg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-taupe text-lg tracking-tight">OWLight</span>
            <span className="text-taupe-light text-[10px] font-bold uppercase tracking-wider border border-slate-200 rounded px-1.5 py-0.5 hidden sm:inline-block">v0.1 Alpha</span>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <Link href="/search">
            <Button variant="ghost" className="h-8 text-xs font-semibold">
              <BookOpen size={14} className="mr-2" />
              Knowledge
            </Button>
          </Link>
          <Link href="/admin/files">
            <Button variant="ghost" className="h-8 text-xs font-semibold">
              <FolderOpen size={14} className="mr-2" />
              Archive
            </Button>
          </Link>
          <div className="h-4 w-[1px] bg-slate-200 mx-1"></div>
          <Link href="/engagement">
            <div className="h-8 w-8 rounded-full bg-cream border border-warm-beige flex items-center justify-center text-terracotta hover:bg-terracotta hover:text-white cursor-pointer transition-all shadow-sm">
              <User size={14} />
            </div>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex flex-col gap-8">

        {/* Simple Page Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold text-taupe tracking-tight mb-1 font-display">Chat</h1>
            <p className="text-taupe-light text-sm font-medium">Your autonomous governance assistant.</p>
          </div>
          <div className="hidden sm:block">
            <Button variant="outline" className="h-8 text-[11px] font-bold text-slate-400 border-dashed">
              <Settings size={12} className="mr-2" />
              PREFERENCES
            </Button>
          </div>
        </div>

        {/* Workspace Area */}
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          <Card className="flex-1 flex flex-col min-h-[500px] overflow-hidden border-slate-200 shadow-sm">

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 custom-scrollbar bg-white">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 py-20">
                  <div className="p-4 rounded-full bg-slate-50 mb-4">
                    <Sparkles size={32} className="text-terracotta/40" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-medium">Waiting for your query...</p>
                </div>
              ) : (
                messages.map(msg => <ChatMessage key={msg.id} message={msg} />)
              )}
              {isSending && (
                <div className="flex w-full mb-8 justify-start items-center">
                  <div className="flex-shrink-0 mr-4">
                    <div className="h-10 w-10 rounded-full bg-sage/10 flex items-center justify-center border border-sage/20">
                      <div className="animate-spin h-4 w-4 border-2 border-sage border-t-transparent rounded-full"></div>
                    </div>
                  </div>
                  <div className="text-sm text-sage font-bold tracking-widest uppercase animate-pulse">Thinking</div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar (Modern SaaS Style) */}
            <div className="p-6 bg-slate-50 border-t border-slate-100">
              <form onSubmit={handleSubmit} className="relative max-w-3xl mx-auto group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Sparkles size={16} className="text-terracotta/40 group-focus-within:text-terracotta transition-colors" />
                </div>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about governance, rules, or anything..."
                  className="w-full h-14 pl-12 pr-16 rounded-xl border border-slate-200 bg-white text-sm text-taupe placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-terracotta/5 focus:border-terracotta shadow-sm transition-all"
                  disabled={isSending}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isSending}
                  className="absolute right-2 top-2 h-10 w-10 flex items-center justify-center rounded-lg bg-terracotta text-white hover:bg-terracotta/90 disabled:opacity-30 disabled:hover:bg-terracotta transition-all shadow-md active:scale-90"
                >
                  <Send size={18} />
                </button>
              </form>
              <div className="text-center mt-4">
                <p className="text-[10px] text-slate-400 font-medium">
                  OWLight uses AI to process information. Always verify critical data with official documentation.
                </p>
              </div>
            </div>
          </Card>
        </div>

      </main>

      {/* Design System Reference: Vercel Dashboard / Linear App / Notion Sidebar */}
    </div>
  );
}
