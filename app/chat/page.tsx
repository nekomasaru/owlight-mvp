'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Message } from '@/types';
import { ChatMessage } from '@/src/domain/types';
import Link from 'next/link';
import {
  BookOpen,
  Send,
  Sparkles,
  Copy,
  Heart,
  Check,
  Plus,
  MessageSquare,
  MessageCircleQuestion,
  Clock,
  Cpu,
  ChevronRight,
  LogOut,
  FileText
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import MorningRitual from '@/components/MorningRitual';
import KnowledgeClipModal from '@/components/KnowledgeClipModal';
import UserSwitcher from '@/components/UserSwitcher';
import { useUser } from '@/contexts/UserContext';
import { useChatSessions, useChatMessages } from '@/hooks/useChatRealtime';
import VitalityGauge from '@/components/ui/VitalityGauge';
import KnowledgeDraftCard from '@/components/KnowledgeDraftCard';

// --- Helper Functions for API calls ---
const apiAwardPoints = async (targetUserIds: string[], points: number, thanks: number) => {
  await fetch('/api/points', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'awardPoints', targetUserIds, points, thanks })
  });
};

const apiConsumeStamina = async (userId: string, stamina: number, timeSaved: number) => {
  await fetch('/api/points', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'consumeStamina', userId, stamina, timeSaved })
  });
};

const apiRecoverStamina = async (userId: string, amount: number) => {
  await fetch('/api/points', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'recoverStamina', userId, stamina: amount })
  });
};

const apiSaveKnowledge = async (data: { title: string; content: string; tags?: string[]; createdBy?: string }) => {
  const res = await fetch('/api/knowledge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
};

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
    secondary: "bg-white/70 dark:bg-card/70 backdrop-blur-md text-taupe dark:text-foreground border border-white/30 dark:border-white/10 hover:bg-white dark:hover:bg-card hover:border-white/50",
    ghost: "hover:bg-taupe/5 dark:hover:bg-white/5 text-taupe-light hover:text-taupe dark:hover:text-foreground",
    outline: "border border-border bg-transparent hover:bg-white dark:hover:bg-card text-taupe dark:text-foreground"
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
      ? 'bg-white dark:bg-card border-white dark:border-slate-700 shadow-premium ring-1 ring-terracotta/5'
      : 'bg-transparent border-transparent hover:bg-white/40 dark:hover:bg-white/10'
      }`}
  >
    <div className="flex items-center gap-2 mb-3">
      <div className={`p-1.5 rounded-lg transition-colors ${active ? 'bg-terracotta text-white' : 'bg-taupe/5 dark:bg-white/10 text-taupe-light group-hover:bg-taupe/10'}`}>
        <Cpu size={14} />
      </div>
      <span className={`text-xs font-bold tracking-tight ${active ? 'text-taupe dark:text-foreground' : 'text-taupe-light'}`}>
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

const MessageItem = ({ message, onLike, onAction, onCopy }: { message: Message, onLike?: (id: string) => void, onAction: (type: string, id: string) => void, onCopy?: (id: string) => void }) => {
  const { user } = useUser(); // Hook to get current role/mentorMode
  const isUser = message.role === 'user';

  // Utility to clean text (strip HTML tags and decode entities)
  const cleanText = (text: string) => {
    if (!text) return "";
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  };

  const [copied, setCopied] = useState(false);
  const [activeCitation, setActiveCitation] = useState<any | null>(null);

  const handleCopy = () => {
    let textToCopy = message.content;

    // Append Citations
    if (message.citations && message.citations.length > 0) {
      textToCopy += "\n\n--- 参照資料 ---\n";
      message.citations.forEach((c: any, index: number) => {
        let title = cleanText(c.title || "出典");
        // Simple heuristic to get a usable URL or indication
        let url = "";
        if (c.sourceType === 'user_submission' || (c.id && c.id.length > 30)) {
          // Should ideally get the base URL from window location if reliable, or just relative
          // For copy-paste, absolute is better. Assuming MVP environment.
          url = `${window.location.origin}/knowledge/view?id=${c.id}`;
        } else {
          url = `${window.location.origin}/api/files/proxy?name=${encodeURIComponent(c.fileName || c.title || '')}`;
        }
        textToCopy += `[${index + 1}] ${title}: ${url}\n`;
      });
    }

    // Clipboard API with Fallback
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          setCopied(true);
          if (onCopy) onCopy(message.id);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(err => {
          console.error('Failed to copy: ', err);
        });
    } else {
      // Fallback for older browsers or non-secure contexts
      try {
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;

        // Avoid scrolling to bottom
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);

        if (successful) {
          setCopied(true);
          if (onCopy) onCopy(message.id);
          setTimeout(() => setCopied(false), 2000);
        }
      } catch (err) {
        console.error('Fallback copy failed: ', err);
      }
    }
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
        <div className="h-14 w-14 rounded-2xl border border-white bg-white shadow-premium overflow-hidden">
          <img src="/Mr.OWL_Silhouette.png" alt="AI" className="w-full h-full object-cover" />
        </div>
      </div>
      <div className={`max-w-[85%] pt-1 group relative`}>
        <div className="flex flex-col gap-2">
          {/* Assistant Message Bubble */}
          <div className="bg-white/80 dark:bg-card/90 backdrop-blur-xl px-6 py-5 rounded-[2rem] rounded-tl-lg shadow-premium border border-white/50 dark:border-white/10">
            <div className="text-taupe dark:text-foreground text-[15px] leading-8 font-normal prose prose-slate dark:prose-invert max-w-none prose-p:mb-4 prose-strong:text-terracotta prose-strong:font-bold prose-ul:my-4 prose-table:rounded-xl prose-table:overflow-hidden prose-table:border-0 prose-th:bg-taupe/5 prose-th:text-taupe prose-th:font-bold prose-td:border-b prose-td:border-taupe/5">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>

            {/* Citations Display Section (Inside Bubble) */}
            {message.citations && message.citations.length > 0 && (
              <div className="mt-6 pt-4 border-t border-taupe/5">
                <p className="text-[9px] font-black text-taupe-light/40 uppercase tracking-[0.2em] mb-3">参照資料</p>
                <div className="flex flex-wrap gap-2">
                  {message.citations.map((citation: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setActiveCitation(citation)}
                      className="flex items-center gap-2 bg-taupe/5 px-3 py-2 rounded-lg border border-transparent text-taupe text-[10px] font-bold hover:bg-taupe/10 hover:border-taupe/20 transition-all text-left w-full sm:w-auto h-auto min-h-[32px]"
                    >
                      <BookOpen size={12} className="flex-shrink-0 text-terracotta" />
                      <span className="break-all whitespace-normal leading-tight flex-1">
                        {(() => {
                          // Inline title formatting for the button
                          let title = cleanText(citation.title || "出典");
                          // Keep [N] prefix for easy correlation with LLM's references

                          // Check if it's purely a UUID (no actual title was found)
                          // Only mark as ナレッジ if the title is a raw UUID
                          const titleWithoutNumber = title.replace(/^\[\d+\]\s*/, '').trim();
                          if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(titleWithoutNumber)) {
                            // The title is just a UUID, replace with friendly name
                            const numMatch = title.match(/^\[(\d+)\]/);
                            title = numMatch ? `[${numMatch[1]}] (ナレッジ) 現場の知恵` : '(ナレッジ) 現場の知恵';
                          } else if (citation.sourceType === 'user_submission') {
                            // It's a knowledge item with a proper title
                            if (!title.includes('(ナレッジ)')) {
                              const numMatch = title.match(/^\[(\d+)\]\s*(.*)$/);
                              if (numMatch) {
                                title = `[${numMatch[1]}] (ナレッジ) ${numMatch[2]}`;
                              } else {
                                title = `(ナレッジ) ${title}`;
                              }
                            }
                          }
                          return title;
                        })()}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>


          {/* General Knowledge Fallback Button (When AI says "no info") */}
          {(message.content.includes("見当たりませんでした") || message.content.includes("情報がありません")) && !message.isGeneralKnowledge && (
            <div className="mt-4 ml-4 animate-in fade-in slide-in-from-top-2 duration-500">
              <button
                onClick={() => onAction('retryWithGeneralKnowledge', message.id)}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-800 px-5 py-3 rounded-xl border border-blue-200 text-xs font-bold shadow-sm transition-all active:scale-95 group/gen"
              >
                <span className="text-lg group-hover/gen:rotate-12 transition-transform">🌐</span>
                <span>一般知識として回答を作成する (外部知識検索)</span>
              </button>
              <p className="mt-2 text-[10px] text-taupe-light ml-1 max-w-md">
                ⚠️ 庁内規定に基づかない、一般的な行政知識やWeb知識で回答します。情報の正確性は保証されません。
              </p>
            </div>
          )}

          {/* Action Buttons - Outside Bubble (Aligned Left) - Hide for welcome message */}
          {message.id !== 'welcome' && (
            <div className="flex items-center gap-3 mt-2 transition-all duration-300 ml-4">

              {/* General Knowledge Badge if applicable */}
              {message.isGeneralKnowledge && (
                <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-3 py-1 rounded-full border border-amber-200 text-[10px] font-bold mr-2">
                  <span>🌐 一般知識 (General Knowledge)</span>
                </div>
              )}


              <button
                onClick={() => onAction('save_knowledge', message.id)}
                className="flex items-center gap-2 bg-white/50 px-4 py-2 rounded-full border border-terracotta/20 text-taupe text-[10px] font-bold shadow-sm hover:shadow-md hover:bg-white transition-all active:scale-95 group/btn"
              >
                <Plus size={12} className="text-sage group-hover/btn:text-terracotta transition-colors" />
                ✨ ナレッジとして登録する <span className="text-sage font-black text-[9px]">+50pt</span>
              </button>

              {/* General Knowledge Indicator in Action Bar */}
              {message.isGeneralKnowledge && (
                <span className="flex items-center gap-1 text-[10px] text-amber-600/70 font-bold ml-2 border-l border-amber-200/50 pl-3">
                  <span className="text-xs">🌐</span> 一般知識による回答
                </span>
              )}

              <div className="flex items-center gap-1 ml-2 border-l border-taupe/10 pl-3">
                <button
                  onClick={() => onAction('create_wanted', message.id)}
                  className="flex items-center gap-1 px-3 py-2 text-taupe-light hover:text-terracotta hover:bg-terracotta/5 rounded-full text-[10px] font-bold transition-all"
                  title="解決しなかった場合、詳しい人に依頼を作成します"
                >
                  <MessageCircleQuestion size={14} />
                  詳しい人に聞く
                </button>

                <div className="relative flex items-center">
                  <button onClick={handleCopy} className="p-2 text-taupe-light hover:text-terracotta transition-colors rounded-full hover:bg-white/50" title="コピー">
                    {copied ? <Check size={14} className="text-sage" /> : <Copy size={14} />}
                  </button>
                  {copied && (
                    <span className="absolute left-full ml-1 px-2 py-1 bg-sage text-white text-[10px] font-bold rounded animate-in fade-in slide-in-from-left-2 duration-200 whitespace-nowrap">
                      コピーしました！
                    </span>
                  )}
                </div>                <button onClick={() => onLike?.(message.id)} className="p-2 text-taupe-light hover:text-pink-400 transition-colors rounded-full hover:bg-white/50" title="感謝">
                  <Heart size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Internal Citation Viewer Modal for this message */}
      {activeCitation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={() => setActiveCitation(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in zoom-in-50 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-terracotta/10 rounded-lg text-terracotta">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-taupe text-sm">参照ドキュメント</h4>
                  <p className="text-xs text-taupe-light font-bold">
                    {(() => {
                      // Title Formatting Logic
                      let title = activeCitation.title || '無題の資料';
                      // Remove [N] prefix for cleaner modal header
                      title = title.replace(/^\[\d+\]\s*/, '');
                      // If it's a knowledge item (UUID check or explicit sourceType), format nicely
                      if (activeCitation.sourceType === 'user_submission' || /^[0-9a-f]{8}-/i.test(title)) {
                        // If title was just the UUID, try to show something generic, otherwise show the actual title
                        if (/^[0-9a-f]{8}-/i.test(title) && !title.includes(' ')) {
                          return '(ナレッジ) 現場の知恵';
                        }
                        if (!title.startsWith('(ナレッジ)')) {
                          return `(ナレッジ) ${title}`;
                        }
                      }
                      return title;
                    })()}
                  </p>
                </div>
              </div>
              <button onClick={() => setActiveCitation(null)} className="p-1 hover:bg-slate-100 rounded-full">
                <LogOut size={16} className="text-slate-400" />
              </button>
            </div>

            {/* Improved Content Area with better scrolling */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 text-sm text-taupe leading-relaxed h-[50vh] overflow-y-auto custom-scrollbar whitespace-pre-wrap font-medium shadow-inner">
              {(() => {
                const content = activeCitation.contentSnippet || activeCitation.content || activeCitation.text || "内容が表示できません";
                try {
                  return cleanText(typeof content === 'string' ? content : JSON.stringify(content));
                } catch (e) { return "表示エラー"; }
              })()}
            </div>

            {/* Link Action */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100 flex justify-between items-center">
              {activeCitation.sourceType === 'user_submission' || (activeCitation.id && activeCitation.id.length > 30) ? (
                <Link
                  href={`/knowledge/view?id=${activeCitation.id}`}
                  target="_blank"
                  className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-2"
                >
                  <BookOpen size={14} />
                  ナレッジ管理画面で見る
                </Link>
              ) : (
                <a
                  href={`/api/files/proxy?name=${encodeURIComponent(activeCitation.fileName || activeCitation.title || '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-2"
                >
                  <FileText size={14} />
                  ファイルを開く
                </a>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <button onClick={() => setActiveCitation(null)} className="px-4 py-2 bg-slate-100 text-taupe text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors">
                閉じる
              </button>
            </div>
          </div>
        </div>
      )
      }
    </div >
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
    <div className="w-full py-4 px-4 flex justify-center bg-white/90 dark:bg-background/90 backdrop-blur-sm border-t border-slate-100 dark:border-slate-800 shrink-0 sticky bottom-0 z-20">
      <div className="w-full max-w-3xl">
        <div className="bg-white dark:bg-stone-800/80 p-2 rounded-[2.5rem] shadow-premium border border-slate-200 dark:border-slate-700 flex items-end gap-2 group transition-all duration-300 hover:shadow-md focus-within:bg-slate-50/50 dark:focus-within:bg-stone-800">
          <div className="p-3 mb-1 text-terracotta/40">
            <Sparkles size={18} />
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
            className="flex-1 bg-transparent border-0 focus:ring-0 outline-none text-taupe dark:text-foreground text-sm py-3 max-h-[140px] resize-none overflow-y-auto custom-scrollbar placeholder:text-taupe-light/50 font-medium leading-relaxed"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || disabled}
            className="mb-1 mr-1 h-10 w-10 flex items-center justify-center rounded-full bg-terracotta text-white hover:bg-terracotta-light disabled:opacity-20 transition-all duration-300 shadow-md active:scale-95"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main SaaS Page ---

// Local type definition to avoid import issues
// Local type definition to avoid import issues
interface IChatMessage {
  id?: string;
  sessionId?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: any[];
  createdAt?: string;
  isGeneralKnowledge?: boolean;
  knowledgeDraft?: {
    title: string;
    content: string;
    tags: string[];
  };
}

// Lazy load KnowledgeRequestModal if possible, but standard import is fine for MVP
import KnowledgeRequestModal from '@/components/KnowledgeRequestModal';

import { useSearchParams } from 'next/navigation';

// ... imports

export default function SaaSPage() {
  const { user, updatePointsOptimistically } = useUser(); // Use Context
  const searchParams = useSearchParams();
  const urlChatId = searchParams.get('id');

  // Local fallback state to ensure assistant messages appear immediately
  const [localAssistantMessages, setLocalAssistantMessages] = useState<IChatMessage[]>([]);
  const [localUserMessages, setLocalUserMessages] = useState<IChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use Chat Realtime Hook
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  // Sync URL Param to State
  useEffect(() => {
    if (urlChatId) {
      setActiveChatId(urlChatId);
    } else {
      setActiveChatId(null);
    }
  }, [urlChatId]);

  const { sessions, createSession, isLoading: isSessionsLoading } = useChatSessions(user.id);
  const { messages: chatMessages, isLoading: isMessagesLoading, sendMessage: sendChatMessage } = useChatMessages(activeChatId || null);
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash-lite');
  const [quotas, setQuotas] = useState({
    'gemini-2.5-flash-lite': { rpm: 5, rpmTotal: 2000, tpm: 2.0, tpmTotal: 5000, rpd: 50, rpdTotal: "無制限" },
    'gemini-2.0-flash': { rpm: 3, rpmTotal: 2000, tpm: 1.56, tpmTotal: 4000, rpd: 13, rpdTotal: "無制限" }
  });

  // Modal & Points
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetMessageId, setTargetMessageId] = useState<string>('');
  const [pointAnim, setPointAnim] = useState<{ x: number, y: number, text: string } | null>(null);
  // Knowledge Distillation
  const [pendingKnowledgeDraft, setPendingKnowledgeDraft] = useState<{ title: string; content: string; tags: string[] } | null>(null);

  // Wanted Modal
  const [isWantedModalOpen, setIsWantedModalOpen] = useState(false);
  const [wantedDraftMessages, setWantedDraftMessages] = useState<ChatMessage[]>([]); // Messages for summary

  const handleAction = async (type: string, id: string) => {
    if (type === 'create_wanted') {
      const msgIndex = displayMessages.findIndex(m => m.id === id);
      if (msgIndex >= 0) {
        // Take recent context (e.g. up to 6 messages ending at current)
        const context = displayMessages.slice(Math.max(0, msgIndex - 5), msgIndex + 1);
        setWantedDraftMessages(context as any); // Cast mainly due to loose typing
        setIsWantedModalOpen(true);
      }
    } else if (type === 'save_knowledge') {
      setTargetMessageId(id);

      // Smart Pre-fill Logic
      const targetMsg = displayMessages.find(m => m.id === id);
      if (targetMsg?.knowledgeDraft) {
        // LLM already extracted - use it directly
        setPendingKnowledgeDraft({
          title: targetMsg.knowledgeDraft.title,
          content: targetMsg.knowledgeDraft.content,
          tags: targetMsg.knowledgeDraft.tags
        });
        setIsModalOpen(true);
      } else if (targetMsg) {
        // Manual registration - Ask LLM to synthesize knowledge from conversation
        const msgIndex = displayMessages.findIndex(m => m.id === id);
        const userMsg = msgIndex > 0 ? displayMessages[msgIndex - 1] : null;

        // Show loading state
        setPendingKnowledgeDraft({
          title: '要約中...',
          content: 'AIがナレッジを要約しています...',
          tags: []
        });
        setIsModalOpen(true);

        try {
          // Call LLM to synthesize knowledge
          const response = await fetch('/api/synthesize-knowledge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userMessage: userMsg?.content || '',
              aiResponse: targetMsg.content
            })
          });

          if (response.ok) {
            const data = await response.json();
            setPendingKnowledgeDraft({
              title: data.title || '',
              content: data.content || '',
              tags: data.tags || []
            });
          } else {
            // Fallback if synthesis fails
            setPendingKnowledgeDraft({
              title: '',
              content: userMsg?.role === 'user'
                ? `【関連する質問】${userMsg.content}\n\n【知見の内容】\n${targetMsg.content.substring(0, 500)}...`
                : targetMsg.content.substring(0, 500),
              tags: []
            });
          }
        } catch (e) {
          console.error('Knowledge synthesis failed:', e);
          // Fallback
          setPendingKnowledgeDraft({
            title: '',
            content: targetMsg.content.substring(0, 500),
            tags: []
          });
        }
      }
    } else if (type === 'retryWithGeneralKnowledge') {
      const lastUserMsg = displayMessages.slice().reverse().find(m => m.role === 'user');
      if (lastUserMsg) {
        handleSendMessage(lastUserMsg.content, true); // Retry with UseGeneralKnowledge = true
      }
    }
  };

  const handleHeart = async (id: string) => {
    // 1. Animation (+5)
    setPointAnim({ x: window.innerWidth / 2, y: window.innerHeight / 2, text: '+5' });
    setTimeout(() => setPointAnim(null), 2000);

    // 2. Attribution for Cited Knowledge
    const msg = displayMessages.find(m => m.id === id);
    if (msg?.citations) {
      const creditUserIds = new Set<string>();
      const feedbackKnowledgeIds = new Set<string>();

      msg.citations.forEach((c: any) => {
        const idStr = String(c.id || '').trim();
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idStr);

        if (isUUID) {
          // If it's a Supabase Knowledge, send feedback to API (awards points to author internally)
          feedbackKnowledgeIds.add(idStr);
        } else {
          // If it's a raw file/manual, try to award points to authorId directly if available
          if (c.authorId) creditUserIds.add(c.authorId);
          if (c.contributors && Array.isArray(c.contributors)) {
            c.contributors.forEach((uid: string) => creditUserIds.add(uid));
          }
        }
      });

      // Send Feedback for Knowledge Items
      for (const kId of Array.from(feedbackKnowledgeIds)) {
        await fetch('/api/knowledge/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            knowledgeId: kId,
            userId: user.id,
            helpful: true
          })
        }).catch(err => console.error('Feedback API Error', err));
      }

      // Award points for non-knowledge items (PDFs etc)
      const uniqueAuthorIds = Array.from(creditUserIds).filter(aid => aid !== user.id);
      if (uniqueAuthorIds.length > 0) {
        await apiAwardPoints(uniqueAuthorIds, 10, 1);
      }
    }

    // 3. Award points to current user
    await apiAwardPoints([user.id], 5, 0);
    updatePointsOptimistically(5); // Optimistic Update

    // 4. Record Time Saved (Resolution) - 50 minutes per Heart in Chat context
    // "Heart" in Chat is considered a "Solution found", saving avg 50 mins
    try {
      await apiConsumeStamina(user.id, 0, 50);
    } catch (e) {
      console.error('Failed to record Time Saved', e);
    }

    // 5. Recover OWL Point (Stamina) -> Removed
    // if (!user.mentorMode) {
    //   await apiRecoverStamina(user.id, 5);
    // }
  };

  const handleModalSubmit = async (data: any) => {
    // 1. Animation (+50)
    setPointAnim({ x: window.innerWidth / 2, y: window.innerHeight / 2, text: '+50' });
    setTimeout(() => setPointAnim(null), 2500);

    // Map Author Name to ID (for attribution)
    const AUTHOR_ID_MAP: { [key: string]: string } = {
      'self': user.id,
      'sato': 'sato_02',
      'yamada': 'tanaka_03',
    };
    const authorId = AUTHOR_ID_MAP[data.author] || user.id;

    // 2. Save Knowledge via API
    await apiSaveKnowledge({
      title: data.title || data.tag || '現場の知恵',
      content: data.memo,
      tags: data.tag ? [data.tag] : [],
      createdBy: authorId
    });

    // 3. Award points to current user
    await apiAwardPoints([user.id], 50, 1);
    updatePointsOptimistically(50); // Optimistic Update

    // 4. Recover OWL Point (Stamina)
    if (!user.mentorMode) {
      await apiRecoverStamina(user.id, 50);
    }

    // 5. Proxy Thanks Bonus (Engagement)
    if (data.author && data.author !== 'self') {
      const targetId = AUTHOR_ID_MAP[data.author];
      if (targetId) {
        try {
          await apiAwardPoints([targetId], 10, 1);
          console.log(`Gave 10pt proxy bonus to ${targetId}`);
        } catch (e) {
          console.error("Failed to give proxy bonus", e);
        }
      }
    }
  };


  const handleCopy = async (id: string) => {
    // Determine target knowledge from citations
    const msg = displayMessages.find(m => m.id === id);
    if (msg?.citations) {
      const feedbackKnowledgeIds = new Set<string>();

      msg.citations.forEach((c: any) => {
        const idStr = String(c.id || '').trim();
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idStr);

        if (isUUID) {
          feedbackKnowledgeIds.add(idStr);
        }
      });

      // Send Feedback (skipPoints: true)
      for (const kId of Array.from(feedbackKnowledgeIds)) {
        await fetch('/api/knowledge/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            knowledgeId: kId,
            userId: user.id,
            helpful: true,
            skipPoints: true // Do not award points
          })
        }).catch(err => console.error('Copy Feedback API Error', err));
      }
    }
  };


  // Derive display messages: Merge hook messages with local fallback messages
  // This ensures that even if the hook fails to update/optimistic update is lost, the local state keeps it visible
  const displayMessages = useMemo(() => {
    // Start with the welcome message if no active chat
    const initialMessages: IChatMessage[] = !activeChatId
      ? [{ id: 'welcome', role: 'assistant', content: '# Welcome to OWLight\n業務に関する質問やマニュアルの検索を、直感的なAIエージェントがお手伝いします。', createdAt: new Date().toISOString() }]
      : [];

    // 1. Merge real history with local optimistic messages (both user and assistant)
    const combined = [...initialMessages, ...chatMessages, ...localAssistantMessages, ...localUserMessages];

    // 2. Sort by time (using explicit or temp timestamp)
    combined.sort((a, b) => {
      const tA = a.createdAt ? new Date(a.createdAt).getTime() : Date.now();
      const tB = b.createdAt ? new Date(b.createdAt).getTime() : Date.now();
      return tA - tB;
    });

    // 3. Deduplicate
    const unique: IChatMessage[] = [];
    const seenIds = new Set<string>();
    const seenContentRole = new Set<string>(); // For deduplicating local messages against real ones

    for (const m of combined) {
      // If it has a real ID (not a local temp ID), and we've seen this ID, skip
      if (m.id && !m.id.startsWith('local_') && !m.id.startsWith('temp_') && seenIds.has(m.id)) {
        continue;
      }

      // Create a content+role signature for checking against real messages
      const contentRoleSignature = `${m.role}:${m.content}`;

      // If this is a local temporary message (local_ or temp_)
      if (m.id?.startsWith('local_') || m.id?.startsWith('temp_')) {
        // Check if a non-local message with the same content and role already exists
        // This means the real message from the DB has arrived, so we can skip the local one
        if (chatMessages.some(cm => cm.content === m.content && cm.role === m.role && cm.id && !cm.id.startsWith('local_') && !cm.id.startsWith('temp_'))) {
          continue;
        }
      }
      // Also check if we've already added a local message with the same content and role
      if (seenContentRole.has(contentRoleSignature)) {
        continue;
      }
      seenContentRole.add(contentRoleSignature);

      // If we haven't skipped it, add it to unique messages
      unique.push(m);
      if (m.id) {
        seenIds.add(m.id);
      }
    }

    return unique;
  }, [activeChatId, chatMessages, localAssistantMessages, localUserMessages]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages, isSending]);

  const startNewChat = () => {
    setActiveChatId(null);
    setLocalAssistantMessages([]);
    setLocalUserMessages([]);
    setIsSending(false);
  };

  const handleSendMessage = async (text: string, useGeneralKnowledge = false) => {
    if ((!text.trim() && !useGeneralKnowledge) || isSending) return;
    setIsSending(true);

    let currentChatId = activeChatId;

    try {
      // Create new session if needed
      if (!currentChatId) {
        const title = text.slice(0, 15) + (text.length > 15 ? '...' : '');
        currentChatId = await createSession(title);
        if (currentChatId) {
          setActiveChatId(currentChatId);
        }
      }

      if (!currentChatId) throw new Error('Failed to create chat session');

      // 1. Send User Message
      // Safety Net: Add to local state immediately
      const localUserMsg: IChatMessage = {
        role: 'user' as const,
        content: text,
        id: `local_user_${Date.now()}`,
        sessionId: currentChatId,
        createdAt: new Date().toISOString()
      };
      setLocalUserMessages(prev => [...prev, localUserMsg]);

      // Pass currentChatId to ensure it persists even if activeChatId state hasn't updated yet
      await sendChatMessage({ role: 'user', content: text }, currentChatId);

      // Consume stamina
      // 2. Call API with conversation context
      const apiMessages = [...displayMessages.filter(m => m.id !== 'welcome' && m.role !== 'system'), { role: 'user', content: text }]
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          model: selectedModel,
          mentorMode: user.mentorMode || false,
          // stamina no longer needed
          useGeneralKnowledge: useGeneralKnowledge // Pass the flag
        })
      });

      if (!response.ok) throw new Error('API Error');
      const data = await response.json();

      // Send assistant response
      const assistantMsg = {
        role: 'assistant' as const,
        content: data.reply || "No response.",
        citations: [...(data.citiedKnowledge || []), ...(data.vertexCitations || [])],
        id: `local_assist_${Date.now()}`, // Temp ID for local state
        isGeneralKnowledge: data.isGeneralKnowledge, // Capture flag
        knowledgeDraft: data.knowledgeDraft // Capture draft
      };

      // 1. Add to local state (Force display)
      setLocalAssistantMessages(prev => [...prev, assistantMsg as any]);

      // 2. Send to hook (Persist to DB)
      await sendChatMessage(assistantMsg, currentChatId);

      // 3. Handle Knowledge Distillation (if any)
      if (data.knowledgeDraft) {
        setPendingKnowledgeDraft(data.knowledgeDraft);
      }

    } catch (error) {
      console.error(error);
      // Remove optimistic user message on error
      if (currentChatId) {
        // We might want to remove the optimistic message if API failed hard
        // But for now let's leave it as 'pending' or similar if we had that state
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="h-full bg-background flex flex-col font-sans antialiased">
      <MorningRitual />



      {/* Content Layout */}
      <main className="flex-1 flex w-full min-h-0">



        {/* Center: Chat Area */}
        <section className="flex-1 flex flex-col min-w-0 bg-white/30">
          <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-8 custom-scrollbar">
            {displayMessages.length > 0 && displayMessages.map((msg, i) => (
              <MessageItem
                key={msg.id || i}
                message={msg as any}
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
          <ChatInput onSendMessage={handleSendMessage} disabled={isSending} />
        </section>

      </main>



      <KnowledgeClipModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          // Do NOT clear pendingKnowledgeDraft immediately to allow user to re-open
        }}
        onSubmit={(data) => {
          handleModalSubmit(data);
          setPendingKnowledgeDraft(null); // Clear only after successful submit
        }}
        initialMessage={targetMessageId}
        initialData={pendingKnowledgeDraft ? {
          title: pendingKnowledgeDraft.title,
          author: 'self',
          tag: pendingKnowledgeDraft.tags[0] || '',
          memo: pendingKnowledgeDraft.content
        } : undefined}
      />

      {/* Floating Knowledge Draft Prompt */}
      {pendingKnowledgeDraft && !isModalOpen && (
        <div className="fixed bottom-32 right-12 z-[100] max-w-sm animate-in slide-in-from-bottom-10 duration-500">
          <div className="relative group">
            {/* Close button for the draft card */}
            <button
              onClick={() => setPendingKnowledgeDraft(null)}
              className="absolute -top-2 -right-2 p-1 bg-white shadow-md rounded-full text-taupe-light hover:text-terracotta z-10 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Check size={14} />
            </button>
            <KnowledgeDraftCard
              draft={pendingKnowledgeDraft}
              onOpenModal={() => {
                setIsModalOpen(true);
              }}
            />
          </div>
        </div>
      )}

      {/* Wanted Modal */}
      <KnowledgeRequestModal
        isOpen={isWantedModalOpen}
        onClose={() => setIsWantedModalOpen(false)}
        messages={wantedDraftMessages}
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
