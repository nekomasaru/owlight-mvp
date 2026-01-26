'use client';

// Updated: Fix HMR sync
import React, { useState, useEffect } from 'react';
import { X, Sparkles, Send, Loader2, MessageCircleQuestion, Flame, UploadCloud } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { ChatMessage } from '@/src/domain/types';

interface KnowledgeRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    messages: ChatMessage[];
    onCreated?: (knowledgeId?: string) => void;
    initialTitle?: string;
    initialContent?: string;
    mode?: 'request' | 'submit_knowledge';
}

export default function KnowledgeRequestModal(props: KnowledgeRequestModalProps) {
    const { isOpen, onClose, messages } = props;
    const { user, updatePointsOptimistically } = useUser();
    const [step, setStep] = useState<'loading' | 'confirm' | 'done'>('loading');
    const [title, setTitle] = useState(props.initialTitle || '');
    const [content, setContent] = useState(props.initialContent || '');
    const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const generateDraft = async () => {
        try {
            const res = await fetch('/api/summarize-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages })
            });
            const data = await res.json();
            if (data.title && data.content) {
                setTitle(data.title);
                setContent(data.content);
                setStep('confirm');
            } else {
                throw new Error('Failed to generate draft');
            }
        } catch (e) {
            console.error(e);
            setTitle('依頼件名を入力');
            setContent('具体的な依頼内容を入力してください。');
            setStep('confirm');
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset and show loading
        setStep('loading');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/analyze-doc', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            // Auto complete
            if (data.title) setTitle(data.title);
            if (data.content) setContent(data.content);

            // Suggest urgent if needed? (Skip for now)

        } catch (err) {
            console.error(err);
            alert('ファイルの分析に失敗しました。');
        } finally {
            setStep('confirm');
        }
    };

    useEffect(() => {
        if (isOpen) {
            if (messages && messages.length > 0) {
                setStep('loading');
                generateDraft();
            } else {
                // Manual mode
                setTitle(props.initialTitle || '');
                setContent(props.initialContent || '');
                setPriority('normal');
                setStep('confirm');
            }
        }
    }, [isOpen, messages]); // Warning: be careful with initial props updates

    const handleSubmit = async () => {
        if (!user) return;
        setIsSubmitting(true);
        try {
            if (props.mode === 'submit_knowledge') {
                // --- KNOWLEDGE SUBMISSION ---
                const res = await fetch('/api/knowledge', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title,
                        content,
                        category: 'general',
                        tags: ['WANTED_RESOLUTION'],
                        createdBy: user.id
                    })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to submit knowledge');

                // Reward
                updatePointsOptimistically(50);
                await fetch('/api/points', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'awardPoints',
                        targetUserIds: [user.id],
                        points: 50, // Higher reward
                        thanks: 0
                    })
                });

                setStep('done');
                setTimeout(() => {
                    props.onCreated?.(data.id); // Pass created ID
                    onClose();
                    setStep('loading');
                }, 2500);

            } else {
                // --- WANTED CREATION ---
                await fetch('/api/wanted', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title,
                        content,
                        priority,
                        userId: user.id
                    })
                });

                // Reward
                updatePointsOptimistically(30);
                await fetch('/api/points', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'awardPoints',
                        targetUserIds: [user.id],
                        points: 30,
                        thanks: 0
                    })
                });

                setStep('done');
                setTimeout(() => {
                    props.onCreated?.();
                    onClose();
                    setStep('loading');
                }, 2500);
            }

        } catch (e) {
            console.error(e);
            alert('送信に失敗しました');
        } finally {
            setIsSubmitting(false);
        }
    };

    const isAiMode = messages && messages.length > 0;
    const isSubmitMode = props.mode === 'submit_knowledge';

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2 text-terracotta font-bold">
                        {isSubmitMode ? <Sparkles size={20} /> : <MessageCircleQuestion size={20} />}
                        <span>{isSubmitMode ? 'ナレッジを投稿 (解決)' : 'Knowledge WANTED'}</span>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {step === 'loading' && (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-terracotta/20 blur-xl rounded-full animate-pulse"></div>
                                <Sparkles className="text-terracotta relative z-10 animate-spin-slow" size={48} />
                            </div>
                            <p className="text-taupe font-medium animate-pulse">
                                {isSubmitMode ? '準備中...' : 'AIが依頼文を作成中...'}
                            </p>
                            {!isSubmitMode && <p className="text-xs text-taupe-light">チャット履歴から要点をまとめています</p>}
                        </div>
                    )}

                    {step === 'confirm' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            {isAiMode && (
                                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800">
                                    <p className="font-bold flex items-center gap-2 mb-1">
                                        <Sparkles size={14} />
                                        AI Draft
                                    </p>
                                    AIがチャット履歴から下書きを作成しました。<br />
                                    内容を確認・修正してください。
                                </div>
                            )}

                            <div className="space-y-4">
                                {/* File Upload Area */}
                                <div className="border border-dashed border-slate-300 rounded-lg p-4 hover:bg-slate-50 transition-colors text-center cursor-pointer relative group">
                                    <input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                        onChange={handleFileUpload}
                                        accept="image/*,.pdf,.txt,.md,.csv" // Accept broadly
                                    />
                                    <div className="flex flex-col items-center gap-2 text-taupe-light group-hover:text-terracotta transition-colors">
                                        <UploadCloud size={24} />
                                        <span className="text-xs font-bold">資料・スクショをここにドロップ (AI自動入力)</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-taupe-light mb-1 uppercase tracking-wider">件名</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg font-bold text-taupe focus:ring-2 focus:ring-terracotta/20 focus:outline-none"
                                        placeholder={isSubmitMode ? "例：○○トラブルの解決手順" : "例：○○の申請手順について"}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-taupe-light mb-1 uppercase tracking-wider">
                                        {isSubmitMode ? '解決策・知見' : '依頼詳細'}
                                    </label>
                                    <textarea
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-taupe min-h-[140px] focus:ring-2 focus:ring-terracotta/20 focus:outline-none resize-none leading-relaxed"
                                        placeholder={isSubmitMode ? "具体的な解決手順や得られた知見を記述してください。" : "具体的に何に困っているか、どのような情報が必要かを記述してください。"}
                                    />
                                </div>

                                {!isSubmitMode && (
                                    <div
                                        className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${priority === 'urgent' ? 'bg-red-50 border-red-200 ring-1 ring-red-200' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}
                                        onClick={() => setPriority(prev => prev === 'normal' ? 'urgent' : 'normal')}
                                    >
                                        <div>
                                            <div className={`font-bold text-sm flex items-center gap-2 ${priority === 'urgent' ? 'text-red-600' : 'text-taupe'}`}>
                                                <Flame size={18} className={priority === 'urgent' ? "fill-red-600 text-red-600" : "text-slate-400"} />
                                                緊急 (優先表示)
                                            </div>
                                            <div className="text-xs text-taupe-light mt-0.5">一覧のトップに表示され、解決期待値が高まります。</div>
                                        </div>
                                        <div className={`w-12 h-6 rounded-full p-1 transition-colors ${priority === 'urgent' ? 'bg-red-500' : 'bg-slate-300'}`}>
                                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${priority === 'urgent' ? 'translate-x-6' : 'translate-x-0'}`} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="pt-2">
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="w-full py-4 bg-terracotta text-white font-bold rounded-xl shadow-lg hover:bg-terracotta-light hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:translate-y-0"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            送信中...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={18} />
                                            {isSubmitMode ? 'ナレッジを投稿 (解決)' : 'WANTEDを作成 (募集開始)'}
                                        </>
                                    )}
                                </button>
                                <p className="text-center text-[10px] text-taupe-light mt-3 font-medium">
                                    {isSubmitMode ? (
                                        <>WANTED解決により <span className="text-amber-500 font-bold">+50pt</span> (推定) 獲得</>
                                    ) : (
                                        <>作成すると <span className="text-amber-500 font-bold">+30pt</span> 獲得できます</>
                                    )}
                                </p>
                            </div>
                        </div>
                    )}

                    {step === 'done' && (
                        <div className="flex flex-col items-center justify-center py-8 space-y-6 animate-in zoom-in duration-300">
                            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 animate-bounce-slow">
                                <Send size={40} />
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-2xl font-black text-taupe">
                                    {isSubmitMode ? 'Submission Complete!' : 'Request Sent!'}
                                </h3>
                                <p className="text-taupe-light">
                                    {isSubmitMode ? 'ナレッジが共有され、WANTEDが解決されました。' : '詳しい人に通知されました。'}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 bg-amber-50 px-6 py-2 rounded-full border border-amber-100 animate-pulse">
                                <span className="text-amber-600 font-bold">
                                    {isSubmitMode ? '+50 OWL Points' : '+30 OWL Points'}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div >
        </div >
    );
}
