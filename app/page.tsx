'use client';

import { useState, useEffect, useRef } from 'react';
import { Message } from '@/types';
import Link from 'next/link';
import {
  BookOpen,
  Send,
  Sparkles,
  User,
  Copy,
  Heart,
  Check,
  RefreshCw,
  LogOut,
  Plus,
  MessageSquare,
  Clock,
  Cpu,
  ChevronRight,
  Settings
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import MorningRitual from '@/components/MorningRitual';
import KnowledgeClipModal from '@/components/KnowledgeClipModal';
import UserSwitcher from '@/components/UserSwitcher'; // Added
import { useUser } from '@/contexts/UserContext'; // Added
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  doc,
  updateDoc,
  increment,
  setDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// --- Types ---

interface ChatSession {
  id: string;
  title: string;
  updatedAt: any;
}

// --- Premium UI Components ---

const GlassButton = ({ children, variant = "primary", className = "", ...props }: any) => {
  const baseStyle = "inline-flex items-center justify-center rounded-xl text-xs font-bold transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 h-10 px-5 shadow-sm active:scale-95 tracking-wide";
  const variants = {
    primary: "bg-terracotta text-white hover:bg-terracotta-light hover:shadow-glow",
    secondary: "bg-white/70 backdrop-blur-md text-taupe border border-white/30 hover:bg-white hover:border-white/50",
    ghost: "hover:bg-taupe/5 text-taupe-light hover:text-taupe",
    outline: "border border-border bg-transparent hover:bg-white text-taupe"
  };
  return (
    <button className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className}`} {...props}>
      {children}
    </button>
  );
};

const QuotaMeter = ({ current, total, label }: any) => {
  const isInfinite = total === "無制限";
  const percentage = isInfinite ? 5 : Math.min((current / (typeof total === 'number' ? total : 1)) * 100, 100);

  return (
    <div className="flex-1 min-w-[40px]">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[8px] font-black text-taupe-light/50 tracking-tighter uppercase">{label}</span>
      </div>
      <div className="h-1 bg-taupe/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-taupe/20 transition-all duration-1000"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

const ModelCard = ({ id, active, onClick, quotas }: any) => (
  <button
    onClick={onClick}
    className={`group relative flex flex-col p-4 rounded-2xl transition-all duration-500 text-left border ${active
      ? 'bg-white border-white shadow-premium ring-1 ring-terracotta/5'
      : 'bg-transparent border-transparent hover:bg-white/40'
      }`}
  >
    <div className="flex items-center gap-2 mb-3">
      <div className={`p-1.5 rounded-lg transition-colors ${active ? 'bg-terracotta text-white' : 'bg-taupe/5 text-taupe-light group-hover:bg-taupe/10'}`}>
        <Cpu size={14} />
      </div>
      <span className={`text-xs font-bold tracking-tight ${active ? 'text-taupe' : 'text-taupe-light'}`}>
        {id}
      </span>
    </div>

    <div className="flex gap-2 w-full">
      <QuotaMeter label="RPM" current={quotas.rpm} total={quotas.rpmTotal} />
      <QuotaMeter label="TPM" current={quotas.tpm} total={quotas.tpmTotal} />
    </div>

    {active && (
      <div className="absolute top-3 right-3 h-1.5 w-1.5 rounded-full bg-terracotta shadow-glow" />
    )}
  </button>
);

const ChatMessage = ({ message, onLike, onAction }: { message: Message, onLike?: (id: string) => void, onAction: (type: string, id: string) => void }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    return (
      <div className={`flex w-full mb-10 justify-end animate-in fade-in slide-in-from-bottom-2 duration-700`}>
        <div className={`max-w-[80%] group relative`}>
          <div className="bg-gradient-to-tr from-terracotta to-terracotta-light text-white px-6 py-4 rounded-[2rem] rounded-tr-lg text-sm font-medium shadow-premium leading-relaxed tracking-wide">
            {message.content}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex w-full mb-12 justify-start animate-in fade-in slide-in-from-bottom-2 duration-700`}>
      <div className="flex-shrink-0 mr-4">
        <div className="h-9 w-9 rounded-2xl border border-white bg-white shadow-premium overflow-hidden">
          <img src="/Mr.OWL.jpg" alt="AI" className="w-full h-full object-cover" />
        </div>
      </div>
      <div className={`max-w-[85%] pt-1 group relative`}>
        <div className="flex flex-col gap-2">
          <div className="text-taupe text-[15px] leading-8 font-normal prose prose-slate max-w-none prose-p:mb-4 prose-strong:text-terracotta prose-strong:font-bold prose-ul:my-4 prose-table:rounded-xl prose-table:overflow-hidden prose-table:border-0 prose-th:bg-taupe/5 prose-th:text-taupe prose-th:font-bold prose-td:border-b prose-td:border-taupe/5">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>

          {/* Action Buttons - Always Visible */}
          <div className="flex items-center gap-3 mt-4 transition-all duration-300">
            <button
              onClick={() => onAction('supplement', message.id)}
              className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-terracotta/30 text-taupe text-[10px] font-bold shadow-sm hover:shadow-md hover:bg-terracotta/5 transition-all active:scale-95 group/btn"
            >
              <Plus size={12} className="text-sage group-hover/btn:text-terracotta transition-colors" />
              現場の補足を入れる <span className="text-sage font-black text-[9px]">+50pt</span>
            </button>

            <div className="flex items-center gap-1 ml-2 border-l border-taupe/10 pl-3">
              <button onClick={handleCopy} className="p-2 text-taupe-light hover:text-terracotta transition-colors rounded-full hover:bg-white" title="コピー">
                {copied ? <Check size={14} className="text-sage" /> : <Copy size={14} />}
              </button>
              <button onClick={() => onLike?.(message.id)} className="p-2 text-taupe-light hover:text-pink-400 transition-colors rounded-full hover:bg-white" title="感謝">
                <Heart size={14} />
              </button>
            </div>
          </div>
        </div>
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
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleSend = () => {
    if (!input.trim() || disabled) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-8 z-30 flex justify-center pointer-events-none">
      <div className="w-full max-w-3xl pointer-events-auto">
        <div className="bg-white/80 backdrop-blur-2xl p-2 rounded-[2.5rem] shadow-premium border border-white/50 flex items-end gap-2 group focus-within:ring-2 focus-within:ring-terracotta/10 transition-all duration-500">
          <div className="p-4 mb-1 text-terracotta/40">
            <Sparkles size={20} />
          </div>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
                e.preventDefault();
                handleSend();
              }
            }}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            placeholder="OWLくんに質問する..."
            className="flex-1 bg-transparent border-0 focus:ring-0 text-taupe text-sm py-4 max-h-[180px] resize-none overflow-y-auto custom-scrollbar placeholder:text-taupe-light/50 font-medium"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || disabled}
            className="mb-1 mr-1 h-12 w-12 flex items-center justify-center rounded-full bg-terracotta text-white hover:bg-terracotta-light disabled:opacity-20 transition-all duration-300 shadow-lg active:scale-90"
          >
            <Send size={20} />
          </button>
        </div>
        <p className="text-center text-[9px] font-bold text-taupe-light/40 mt-3 tracking-widest">
          この会話は3日後にナレッジとして自動公開されます　<button className="underline hover:text-terracotta transition-colors">拒否する</button>
        </p>
      </div>
    </div>
  );
};

// --- Main SaaS Page ---

export default function SaaSPage() {
  const { user } = useUser(); // Use Context
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // History State
  const [history, setHistory] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  // Model State
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [quotas, setQuotas] = useState({
    'gemini-2.5-flash': { rpm: 2, rpmTotal: 1000, tpm: 117.67, tpmTotal: 1000, rpd: 24, rpdTotal: 10000 },
    'gemini-2.0-flash': { rpm: 3, rpmTotal: 2000, tpm: 1.56, tpmTotal: 4000, rpd: 13, rpdTotal: "無制限" }
  });

  // Modal & Points
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetMessageId, setTargetMessageId] = useState<string>('');
  const [pointAnim, setPointAnim] = useState<{ x: number, y: number, text: string } | null>(null);

  const handleAction = (type: string, id: string) => {
    if (type === 'supplement') {
      setTargetMessageId(id);
      setIsModalOpen(true);
    }
  };

  const handleHeart = async (id: string) => {
    // 1. Animation (+5)
    setPointAnim({ x: window.innerWidth / 2, y: window.innerHeight / 2, text: '+5' });
    setTimeout(() => setPointAnim(null), 2000);

    // 2. Firestore
    const statsRef = doc(db, 'users', user.id, 'stats', 'total');
    await setDoc(statsRef, {
      points: increment(5),
      heartsGiven: increment(1)
    }, { merge: true });
  };

  const handleModalSubmit = async (data: any) => {
    // 1. Animation (+50)
    setPointAnim({ x: window.innerWidth / 2, y: window.innerHeight / 2, text: '+50' });
    setTimeout(() => setPointAnim(null), 2500);

    // 2. Firestore: Save Knowledge
    await addDoc(collection(db, 'knowledge'), {
      content: data.memo,
      tags: data.tag ? [data.tag] : [],
      author: data.author === 'self' ? user.name : data.author,
      relatedMessageId: data.relatedMessage || null,
      points: 50,
      createdAt: serverTimestamp()
    });

    // 3. Firestore: Update Points
    const statsRef = doc(db, 'users', user.id, 'stats', 'total');
    await setDoc(statsRef, {
      points: increment(50),
      knowledgeCount: increment(1)
    }, { merge: true });
  };

  // 1. Load History
  useEffect(() => {
    const q = query(
      collection(db, 'users', user.id, 'chats'),
      orderBy('updatedAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title || '新しいチャット',
        updatedAt: doc.data().updatedAt
      }));
      setHistory(chats);
    });
    return () => unsubscribe();
  }, [user.id]);

  // 2. Load Messages for Active Chat
  useEffect(() => {
    if (!activeChatId) {
      setMessages([
        { id: 'welcome', role: 'assistant', content: '# Welcome to OWLight\n業務に関する質問やマニュアルの検索を、直感的なAIエージェントがお手伝いします。' }
      ]);
      return;
    }

    const q = query(
      collection(db, 'users', user.id, 'chats', activeChatId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        role: doc.data().role,
        content: doc.data().content
      })) as Message[];

      if (msgs.length === 0) {
        setMessages([]);
      } else {
        setMessages(msgs);
      }
    });

    return () => unsubscribe();
  }, [activeChatId, user.id]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const startNewChat = () => {
    setActiveChatId(null);
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isSending) return;
    setIsSending(true);

    let chatId = activeChatId;

    try {
      if (!chatId) {
        const chatRef = await addDoc(collection(db, 'users', user.id, 'chats'), {
          title: text.slice(0, 15) + (text.length > 15 ? '...' : ''),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        chatId = chatRef.id;
        setActiveChatId(chatId);
      } else {
        const chatRef = doc(db, 'users', user.id, 'chats', chatId);
        await updateDoc(chatRef, { updatedAt: serverTimestamp() });
      }

      await addDoc(collection(db, 'users', user.id, 'chats', chatId, 'messages'), {
        role: 'user',
        content: text,
        createdAt: serverTimestamp()
      });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: text }], model: selectedModel }),
      });

      if (!response.ok) throw new Error('API Error');
      const data = await response.json();

      await addDoc(collection(db, 'users', user.id, 'chats', chatId, 'messages'), {
        role: 'assistant',
        content: data.reply || "No response.",
        createdAt: serverTimestamp()
      });

    } catch (error) {
      console.error(error);
      if (chatId) {
        await addDoc(collection(db, 'users', user.id, 'chats', chatId, 'messages'), {
          role: 'assistant',
          content: "現在オフラインか、接続エラーが発生しています。",
          createdAt: serverTimestamp()
        });
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="h-screen bg-background flex flex-col font-sans overflow-hidden antialiased">
      <MorningRitual />

      {/* Premium Navbar */}
      <header className="sticky top-0 z-40 h-16 bg-white/70 backdrop-blur-xl border-b border-white/20 px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-2xl bg-white shadow-premium flex items-center justify-center border border-white p-0.5">
            <img src="/Mr.OWL.jpg" alt="Logo" className="w-full h-full object-cover rounded-[0.8rem]" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-taupe text-lg tracking-tight leading-none mb-1">OWLight</span>
            <span className="text-[8px] font-black text-taupe-light/50 tracking-[0.2em] uppercase">自治体専用生成AI基盤</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <nav className="flex items-center gap-1 bg-taupe/5 p-1 rounded-xl mr-4">
            <Link href="/search">
              <GlassButton variant="ghost" className="h-8 px-3 text-[10px] uppercase tracking-widest">ナレッジ検索</GlassButton>
            </Link>
            <Link href="/admin/files">
              <GlassButton variant="ghost" className="h-8 px-3 text-[10px] uppercase tracking-widest">ファイル管理</GlassButton>
            </Link>
          </nav>

          <div className="flex items-center gap-3 border-l border-taupe/10 pl-4">
            <button
              onClick={() => { localStorage.removeItem('lastMorningRitual'); window.location.reload(); }}
              className="p-2 text-taupe-light hover:text-terracotta transition-colors"
              title="儀式リセット"
            >
              <RefreshCw size={16} />
            </button>
            <Link href="/engagement">
              <div className="h-9 w-9 rounded-full bg-white shadow-premium border border-white flex items-center justify-center text-terracotta hover:scale-110 transition-transform cursor-pointer">
                <User size={18} />
              </div>
            </Link>
            <Link href="/closing">
              <button
                className="p-2 text-taupe-light hover:text-terracotta transition-colors"
                title="業務終了 (ログオフ)"
              >
                <LogOut size={16} />
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content Layout */}
      <main className="flex-1 flex w-full max-w-7xl mx-auto min-h-0">

        {/* Left Sidebar: Reordered & Scrollable */}
        <aside className="w-72 bg-transparent border-r border-taupe/5 hidden lg:flex flex-col overflow-y-auto custom-scrollbar">
          <div className="p-6 space-y-8">

            {/* 1. Settings */}
            <Link href="/admin/prompts" className="flex items-center justify-between p-3 rounded-xl hover:bg-white transition-colors group border border-transparent hover:border-taupe/5">
              <span className="text-xs font-bold text-taupe-light group-hover:text-taupe">システムプロンプト設定</span>
              <ChevronRight size={14} className="text-taupe-light/30" />
            </Link>

            {/* 2. Models Section */}
            <div>
              <h3 className="text-[10px] font-black text-taupe-light/40 uppercase tracking-[0.2em] mb-4">AIモデル・リソース</h3>
              <div className="flex flex-col gap-2">
                {Object.entries(quotas).map(([id, q]) => (
                  <ModelCard
                    key={id}
                    id={id}
                    active={selectedModel === id}
                    onClick={() => setSelectedModel(id)}
                    quotas={q}
                  />
                ))}
              </div>
            </div>

            {/* 3. New Chat & History Section */}
            <div>
              <button
                onClick={startNewChat}
                className="flex items-center justify-center gap-2 w-full py-4 bg-terracotta text-white rounded-2xl font-bold shadow-lg hover:bg-terracotta-light transition-all active:scale-95 mb-6"
              >
                <Plus size={18} />
                <span>新しいチャット</span>
              </button>

              <h3 className="text-[10px] font-black text-taupe-light/40 uppercase tracking-[0.2em] mb-4 pl-2">履歴</h3>
              <div className="space-y-2">
                {history.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => setActiveChatId(chat.id)}
                    className={`w-full text-left p-4 rounded-2xl transition-all duration-300 group relative overflow-hidden ${activeChatId === chat.id
                      ? 'bg-white shadow-premium border border-white'
                      : 'hover:bg-white/40 border border-transparent'
                      }`}
                  >
                    <div className="flex items-start gap-3 relative z-10">
                      <MessageSquare size={16} className={`mt-0.5 ${activeChatId === chat.id ? 'text-terracotta' : 'text-taupe-light'}`} />
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-xs font-bold truncate mb-1 ${activeChatId === chat.id ? 'text-taupe' : 'text-taupe-light group-hover:text-taupe'}`}>
                          {chat.title}
                        </h4>
                        <div className="flex items-center gap-1 text-[9px] font-bold text-taupe-light/40 uppercase">
                          <Clock size={10} />
                          {chat.updatedAt?.toDate ? chat.updatedAt.toDate().toLocaleDateString() : 'Just now'}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
                {history.length === 0 && (
                  <div className="text-center py-10 text-taupe-light/30 text-xs font-bold">
                    履歴はありません
                  </div>
                )}
              </div>
            </div>

          </div>
        </aside>

        {/* Center: Chat Area */}
        <section className="flex-1 flex flex-col min-w-0 bg-white/30">
          <div className="flex-1 overflow-y-auto px-6 py-12 sm:px-12 lg:px-24 pb-40 custom-scrollbar">
            {messages.length > 0 && messages.map((msg, i) => (
              <ChatMessage
                key={msg.id || i}
                message={msg}
                onAction={handleAction}
                onLike={handleHeart}
              />
            ))}
            {isSending && (
              <div className="flex items-center gap-4 animate-pulse mb-8">
                <div className="h-8 w-8 rounded-full bg-terracotta/5 flex items-center justify-center border border-terracotta/20">
                  <div className="h-2 w-2 bg-terracotta rounded-full"></div>
                </div>
                <span className="text-[10px] font-black text-terracotta tracking-[0.3em] uppercase">思考中...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </section>

      </main>

      <ChatInput onSendMessage={handleSendMessage} disabled={isSending} />

      <KnowledgeClipModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialMessage={targetMessageId}
      />

      {/* Premium Point Animation */}
      {pointAnim && (
        <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
          <div className="relative animate-burst-in">
            {/* Shockwave */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-amber-400/30 rounded-full animate-shockwave"></div>

            {/* Main Text */}
            <div className="relative flex flex-col items-center">
              <span className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-amber-500 to-amber-600 drop-shadow-2xl filter animate-text-pop" style={{ textShadow: '0 4px 30px rgba(245, 158, 11, 0.6)' }}>
                {pointAnim.text}
              </span>
              <span className="text-2xl font-black text-amber-500 tracking-[0.5em] uppercase mt-4 animate-fade-in-up">
                Points Get
              </span>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes burst-in {
          0% { transform: scale(0.5); opacity: 0; }
          40% { transform: scale(1.1); opacity: 1; }
          60% { transform: scale(1.0); }
          100% { transform: scale(1.0); opacity: 0; }
        }
        @keyframes shockwave {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
        }
        @keyframes text-pop {
          0% { transform: translateY(20px); letter-spacing: -0.1em; }
          100% { transform: translateY(0); letter-spacing: normal; }
        }
        @keyframes fade-in-up {
          0% { transform: translateY(10px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .animate-burst-in {
          animation: burst-in 2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-shockwave {
          animation: shockwave 1.5s ease-out forwards;
        }
        .animate-text-pop {
          animation: text-pop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out 0.3s forwards;
          opacity: 0; /* start hidden */
        }
        .shadow-premium {
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.05), 0 4px 10px -5px rgba(0, 0, 0, 0.03);
        }
        .shadow-glow {
          box-shadow: 0 0 20px rgba(179, 94, 63, 0.2);
        }
      `}</style>
    </div>
  );
}
