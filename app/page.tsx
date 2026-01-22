'use client';

import { useState, useEffect, useRef } from 'react';
import { Message } from '@/types';
import Link from 'next/link';
import { BookOpen, FolderOpen, Send, Sparkles, User, Settings, Copy, Heart, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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

const QuotaBar = ({ label, current, total, unit = "" }: any) => {
  const isInfinite = total === "無制限";
  const percentage = isInfinite ? 5 : Math.min((current / (typeof total === 'number' ? total : 1)) * 100, 100);

  return (
    <div className="flex items-center gap-2 sm:gap-4 flex-1">
      <div className="flex flex-col gap-1 w-full">
        <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 mb-0.5">
          <span>{label}</span>
          <span>{current}{unit} / {typeof total === 'number' && total >= 1000 ? `${total / 1000}K` : total}</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden relative">
          <div
            className="absolute left-0 top-0 h-full bg-slate-400 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};

const ModelStatusGrid = ({ selectedModel, setSelectedModel, quotas }: any) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Object.entries(quotas).map(([modelId, data]: any) => (
        <div
          key={modelId}
          onClick={() => setSelectedModel(modelId)}
          className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center gap-4 ${selectedModel === modelId
            ? 'border-terracotta bg-white shadow-md ring-2 ring-terracotta/10'
            : 'border-slate-200 bg-white/50 hover:bg-white hover:border-slate-300'
            }`}
        >
          <div className="flex flex-col min-w-[120px]">
            <span className={`text-xs font-bold leading-tight ${selectedModel === modelId ? 'text-terracotta' : 'text-slate-600'}`}>
              {modelId}
            </span>
            <span className="text-[10px] text-slate-400 font-medium mt-1">テキスト出力モデル</span>
          </div>

          <div className="flex items-center gap-4 flex-1 w-full">
            <QuotaBar label="RPM" current={data.rpm} total={data.rpmTotal} />
            <QuotaBar label="TPM" current={data.tpm} total={data.tpmTotal} unit="K" />
            <QuotaBar label="RPD" current={data.rpd} total={data.rpdTotal} />
          </div>

          {selectedModel === modelId && (
            <div className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-terracotta animate-ping" />
          )}
        </div>
      ))}
    </div>
  );
};

const ChatMessage = ({ message, onLike }: { message: Message, onLike?: (id: string) => void }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex w-full mb-8 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 mr-4">
          <div className="h-10 w-10 rounded-full border-2 border-sage overflow-hidden shadow-sm bg-white">
            <img src="/Mr.OWL.jpg" alt="AI" className="w-full h-full object-cover" />
          </div>
        </div>
      )}
      <div className={`max-w-[85%] ${isUser ? '' : 'pt-2'} group relative`}>
        {isUser ? (
          <div className="bg-terracotta text-white px-5 py-3 rounded-2xl rounded-tr-sm text-sm font-medium shadow-sm leading-relaxed">
            {message.content}
          </div>
        ) : (
          <div className="flex flex-col gap-2 overflow-x-auto">
            <div className="text-taupe text-sm leading-7 font-medium prose prose-slate max-w-none prose-sm prose-p:leading-relaxed prose-strong:text-taupe prose-strong:font-bold prose-ul:list-disc prose-ol:list-decimal prose-table:border prose-table:border-slate-200 prose-th:bg-slate-50 prose-th:p-2 prose-td:p-2 prose-td:border-t overflow-x-auto">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>

            {/* Actions: Copy & Like */}
            <div className="flex items-center gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-terracotta transition-colors"
                title="クリップボードにコピー"
              >
                {copied ? <Check size={12} className="text-sage" /> : <Copy size={12} />}
                {copied ? "コピー完了" : "コピー"}
              </button>
              <button
                onClick={() => onLike?.(message.id)}
                className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors"
                title="感謝を送る"
              >
                <Heart size={12} />
                感謝
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ChatInput = ({ onSendMessage, disabled }: { onSendMessage: (text: string) => void, disabled: boolean }) => {
  const [input, setInput] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!input.trim() || disabled) return;
    onSendMessage(input);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  return (
    <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex-shrink-0">
      <div className="relative max-w-3xl mx-auto group">
        <div className="absolute top-4 left-4 flex items-center pointer-events-none">
          <Sparkles size={16} className="text-terracotta/40 group-focus-within:text-terracotta transition-colors" />
        </div>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          placeholder="業務に関する疑問、ルールの確認など、何でも聞いてください..."
          className="w-full cursor-text min-h-[56px] pl-12 pr-16 py-4 rounded-xl border border-slate-200 bg-white text-sm text-taupe placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-terracotta/5 focus:border-terracotta shadow-sm transition-all resize-none overflow-hidden"
          disabled={disabled}
          rows={1}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || disabled}
          className="absolute right-2 bottom-2 h-10 w-10 flex items-center justify-center rounded-lg bg-terracotta text-white hover:bg-terracotta/90 disabled:opacity-30 disabled:hover:bg-terracotta transition-all shadow-md active:scale-90"
        >
          <Send size={18} />
        </button>
      </div>
      <div className="text-center mt-3">
        <p className="text-[10px] text-slate-400 font-medium">
          OWLightはAIを使用して情報を処理します。重要なデータは必ず公式ドキュメントで確認してください。
        </p>
      </div>
    </div>
  );
};

// --- Main Page ---

export default function SaaSPage() {
  // const [input, setInput] = useState(''); // Moved to ChatInput
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [quotas, setQuotas] = useState({
    'gemini-2.5-flash': { rpm: 2, rpmTotal: 1000, tpm: 117.67, tpmTotal: 1000, rpd: 24, rpdTotal: 10000 },
    'gemini-2.0-flash': { rpm: 3, rpmTotal: 2000, tpm: 1.56, tpmTotal: 4000, rpd: 13, rpdTotal: "無制限" }
  });
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

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isSending) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    // setInput(''); // Handled in ChatInput
    setIsSending(true);

    // Update Quota Simulation
    setQuotas(prev => {
      const current = (prev as any)[selectedModel];
      return {
        ...prev,
        [selectedModel]: {
          ...current,
          rpm: Math.min(current.rpm + 1, typeof current.rpmTotal === 'number' ? current.rpmTotal : 9999),
          tpm: +(current.tpm + (text.length / 100)).toFixed(2),
          rpd: current.rpd + 1
        }
      };
    });

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          model: selectedModel
        }),
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

  const handleLike = (id: string) => {
    console.log("Liked:", id);
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans overflow-hidden">

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
              ナレッジ検索
            </Button>
          </Link>
          <Link href="/admin/files">
            <Button variant="ghost" className="h-8 text-xs font-semibold">
              <FolderOpen size={14} className="mr-2" />
              アーカイブ
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
      <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex flex-col gap-4 min-h-0">

        {/* Simple Page Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold text-taupe tracking-tight mb-1 font-display">AIチャット</h1>
            <p className="text-taupe-light text-sm font-medium">あなたの業務を支える、自律型アシスタント。</p>
          </div>
          <div className="hidden sm:block">
            <Link href="/admin/prompts">
              <Button variant="outline" className="h-8 text-[11px] font-bold text-slate-400 border-dashed">
                <Settings size={12} className="mr-2" />
                設定
              </Button>
            </Link>
          </div>
        </div>

        {/* Model Status & Selection */}
        <ModelStatusGrid
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          quotas={quotas}
        />

        {/* Workspace Area */}
        <div className="flex-1 flex flex-col min-h-0">
          <Card className="flex-1 flex flex-col min-h-0 overflow-hidden border-slate-200 shadow-sm">

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 custom-scrollbar bg-white">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 py-20">
                  <div className="p-4 rounded-full bg-slate-50 mb-4">
                    <Sparkles size={32} className="text-terracotta/40" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-medium">あなたの質問をお待ちしています...</p>
                </div>
              ) : (
                messages.map(msg => <ChatMessage key={msg.id} message={msg} onLike={handleLike} />)
              )}
              {isSending && (
                <div className="flex w-full mb-8 justify-start items-center">
                  <div className="flex-shrink-0 mr-4">
                    <div className="h-10 w-10 rounded-full bg-sage/10 flex items-center justify-center border border-sage/20">
                      <div className="animate-spin h-4 w-4 border-2 border-sage border-t-transparent rounded-full"></div>
                    </div>
                  </div>
                  <div className="text-sm text-sage font-bold tracking-widest uppercase animate-pulse">思考中...</div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar (Modern SaaS Style) */}
            <ChatInput onSendMessage={handleSendMessage} disabled={isSending} />
          </Card>
        </div>

      </main>

      {/* Design System Reference: Vercel Dashboard / Linear App / Notion Sidebar */}
    </div>
  );
}
