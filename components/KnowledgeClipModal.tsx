'use client';

import { useState, useEffect } from 'react';
import { X, Send, User, ChevronDown, Check } from 'lucide-react';

interface KnowledgeClipModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    initialMessage?: string;
    initialData?: { title?: string; author: string; tag: string; memo: string };
}

export default function KnowledgeClipModal({ isOpen, onClose, onSubmit, initialMessage, initialData }: KnowledgeClipModalProps) {
    const [title, setTitle] = useState(initialData?.title || '');
    const [author, setAuthor] = useState(initialData?.author || 'self');
    const [tag, setTag] = useState(initialData?.tag || '');
    const [memo, setMemo] = useState(initialData?.memo || '');

    // Update local state when initialData changes (e.g., from Knowledge Distillation)
    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title || '');
            setAuthor(initialData.author || 'self');
            setTag(initialData.tag || '');
            setMemo(initialData.memo || '');
        }
    }, [initialData]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        onSubmit({ title, author, tag, memo, relatedMessage: initialMessage });
        onClose();
    };

    const categories = [
        { label: '前例・運用ルール', value: '前例・運用ルール' },
        { label: '住民対応のコツ', value: '住民対応のコツ' },
        { label: '法解釈・根拠', value: '法解釈・根拠' },
        { label: '事務効率化', value: '事務効率化' },
        { label: 'トラブル事例', value: 'トラブル事例' },
        { label: 'その他', value: 'その他' }
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-taupe/20 backdrop-blur-md transition-opacity duration-500"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl transform transition-all animate-in fade-in zoom-in-95 duration-300 border border-white/50 overflow-hidden">

                {/* Loading Overlay */}
                {title === '要約中...' && (
                    <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-full border-4 border-taupe/10 border-t-terracotta animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-2 h-2 bg-terracotta rounded-full animate-pulse"></div>
                            </div>
                        </div>
                        <p className="mt-4 text-sm font-bold text-taupe animate-pulse">AIが会話からナレッジを抽出中...</p>
                        <p className="mt-1 text-xs text-taupe-light">要点をまとめています</p>
                    </div>
                )}

                {/* Header */}
                <div className="px-8 py-6 flex items-center justify-between border-b border-taupe/5 bg-white/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-terracotta/10 rounded-xl text-terracotta">
                            <Send size={20} className="transform -rotate-45 translate-x-1" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-taupe tracking-tight">現場の知恵クリップ</h2>
                            <span className="text-[10px] font-bold text-taupe-light/50 uppercase tracking-widest">Knowledge Clipper</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-taupe-light hover:text-taupe hover:bg-taupe/5 rounded-full p-2 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">

                    {/* Title Section */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-taupe-light/40 uppercase tracking-[0.2em] ml-1">
                            ナレッジのタイトル
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="例: 統合宛名番号の管理上の注意点"
                            className="w-full bg-[#FAF9F6] border border-transparent focus:border-terracotta/30 focus:bg-white rounded-2xl p-4 text-sm font-bold text-taupe placeholder:text-taupe-light/30 focus:outline-none focus:ring-4 focus:ring-terracotta/5 transition-all shadow-sm"
                        />
                    </div>

                    {/* Author Section */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-taupe-light/40 uppercase tracking-[0.2em] ml-1">
                            誰の知恵ですか？
                        </label>
                        <div className="relative group">
                            <select
                                value={author}
                                onChange={(e) => setAuthor(e.target.value)}
                                className="w-full bg-[#FAF9F6] hover:bg-[#F5F5F3] border border-transparent focus:border-terracotta/30 focus:bg-white rounded-2xl p-4 text-taupe font-bold text-sm outline-none appearance-none cursor-pointer transition-all shadow-sm"
                            >
                                <option value="self">自分 (My Insight)</option>
                                <option value="sato">佐藤 係長 (代筆 + 感謝通知)</option>
                                <option value="yamada">山田 主査 (代筆 + 感謝通知)</option>
                            </select>
                            <div className="absolute right-4 top-4 pointer-events-none text-taupe-light group-hover:text-terracotta transition-colors">
                                <ChevronDown size={16} />
                            </div>
                        </div>
                    </div>

                    {/* Tags Section */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-taupe-light/40 uppercase tracking-[0.2em] ml-1">
                            カテゴリ分類
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {categories.map((c) => (
                                <label key={c.value} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-300 group ${tag === c.value
                                    ? 'bg-terracotta/5 border-terracotta/30 shadow-sm'
                                    : 'bg-[#FAF9F6] border-transparent hover:bg-[#F5F5F3]'
                                    }`}>
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${tag === c.value ? 'border-terracotta bg-terracotta' : 'border-taupe/20 bg-white group-hover:border-terracotta/30'
                                        }`}>
                                        {tag === c.value && <Check size={10} className="text-white" strokeWidth={4} />}
                                    </div>
                                    <span className={`text-[11px] font-bold ${tag === c.value ? 'text-terracotta' : 'text-taupe'}`}>{c.label}</span>
                                    <input type="radio" name="tag" value={c.value} checked={tag === c.value} onChange={() => setTag(c.value)} className="hidden" />
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Memo Section */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-taupe-light/40 uppercase tracking-[0.2em] ml-1">
                            内容・詳細
                        </label>
                        <textarea
                            value={memo}
                            onChange={(e) => setMemo(e.target.value)}
                            placeholder="知見の具体的な内容を記入してください..."
                            rows={4}
                            className="w-full bg-[#FAF9F6] border border-transparent focus:border-terracotta/30 focus:bg-white rounded-2xl p-4 text-sm font-medium text-taupe placeholder:text-taupe-light/30 focus:outline-none focus:ring-4 focus:ring-terracotta/5 transition-all shadow-sm resize-none custom-scrollbar"
                        />
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-taupe/5">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50 animate-pulse" />
                            <span className="text-[10px] font-bold text-taupe-light/60 tracking-wider">庁内限定保存 (Secure)</span>
                        </div>
                        <button
                            onClick={handleSubmit}
                            className="group relative bg-[#1A1A1A] text-white overflow-hidden rounded-xl px-8 py-3.5 shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-terracotta via-orange-400 to-terracotta opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative flex items-center gap-2 font-bold text-xs tracking-widest">
                                <Send size={14} className="group-hover:translate-x-1 transition-transform" />
                                <span>送信する (+50pt)</span>
                            </div>
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}

