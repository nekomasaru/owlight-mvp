'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
    Search,
    ArrowLeft,
    BookOpen,
    Sparkles,
    MessageSquare,
    FileText,
    ChevronRight,
    Database,
    AlertCircle,
    Edit // Added
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import KnowledgeClipModal from '@/components/KnowledgeClipModal';
import { useUser } from '@/contexts/UserContext';
import UserSwitcher from '@/components/UserSwitcher'; // Added // Added

// --- Simple Components (Consistent with Chat/Admin Pages) ---

const Button = ({ children, variant = "primary", className = "", ...props }: any) => {
    const baseStyle = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 shadow-sm active:scale-95";
    const variants = {
        primary: "bg-terracotta text-white hover:bg-terracotta/90",
        secondary: "bg-white text-taupe border border-slate-200 hover:bg-slate-50 hover:text-terracotta",
        ghost: "hover:bg-slate-100 text-taupe-light hover:text-terracotta shadow-none",
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

type SearchResult = {
    id: string;
    title: string;
    content: string;
    score: number;
    tags?: string[];
    author?: string;
};

export default function SearchPage() {
    const { user } = useUser(); // Use Context
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editingItem, setEditingItem] = useState<SearchResult | null>(null);

    const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
        setError(null);
        setResults([]);

        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
                cache: 'no-store',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '検索中にエラーが発生しました');
            }

            const data = await response.json();
            setResults(data.results);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditSubmit = async (data: any) => {
        if (!editingItem) return;
        try {
            const docRef = doc(db, 'knowledge', editingItem.id);
            await updateDoc(docRef, {
                content: data.memo,
                tags: [data.tag],
                author: data.author === 'self' ? user.name : data.author
            });
            // Local Update
            setResults(prev => prev.map(r =>
                r.id === editingItem.id
                    ? { ...r, content: data.memo, title: data.tag, tags: [data.tag], author: data.author === 'self' ? user.name : data.author }
                    : r
            ));
            alert("ナレッジを更新しました");
        } catch (e) {
            console.error(e);
            alert("更新エラー");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">

            {/* SaaS Header */}
            <header className="sticky top-0 z-10 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 h-14 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full border border-terracotta overflow-hidden shadow-sm">
                        <img src="/Mr.OWL.jpg" alt="Logo" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="font-bold text-taupe text-lg tracking-tight">OWLight</span>
                        <span className="text-taupe-light text-[10px] font-bold uppercase tracking-wider border border-slate-200 rounded px-1.5 py-0.5">ナレッジ検索</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <UserSwitcher />
                    <Link href="/">
                        <Button variant="ghost" className="h-8 text-xs font-semibold">
                            <ArrowLeft size={14} className="mr-2" />
                            チャットに戻る
                        </Button>
                    </Link>
                </div>
            </header>

            <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-12 flex flex-col gap-10">

                {/* Search Bar Section (Large & Focused) */}
                <div className="flex flex-col items-center text-center gap-6">
                    <div className="p-4 bg-terracotta/10 rounded-3xl text-terracotta">
                        <Database size={40} strokeWidth={1.5} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-taupe tracking-tight mb-2 font-display">ナレッジ検索</h1>
                        <p className="text-taupe-light text-sm max-w-md mx-auto leading-relaxed">
                            庁内の共有ナレッジ（現場の知恵）を検索します。
                        </p>
                    </div>

                    <form onSubmit={handleSearch} className="w-full max-w-2xl relative group mt-4">
                        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                            <Search size={20} className="text-slate-400 group-focus-within:text-terracotta transition-colors" />
                        </div>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="キーワードを入力 (例: テレワーク規定, セキュリティルール)..."
                            className="w-full h-16 pl-14 pr-32 rounded-2xl border border-slate-200 bg-white text-base text-taupe placeholder:text-slate-300 focus:outline-none focus:ring-8 focus:ring-terracotta/5 focus:border-terracotta shadow-md transition-all font-medium"
                            disabled={isLoading}
                        />
                        <div className="absolute right-3 top-3">
                            <Button
                                type="submit"
                                className="h-10 px-6 rounded-xl font-bold"
                                disabled={isLoading || !query.trim()}
                            >
                                {isLoading ? "検索中..." : "検索"}
                            </Button>
                        </div>
                    </form>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-3 text-sm font-medium">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                {/* Results Section */}
                <div className="flex flex-col gap-6">
                    {results.length > 0 && (
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-sm font-bold text-taupe uppercase tracking-widest flex items-center gap-2">
                                <Sparkles size={16} className="text-terracotta" />
                                検索結果 ({results.length}件)
                            </h2>
                        </div>
                    )}

                    <div className="grid gap-6">
                        {results.map((result) => (
                            <Card key={result.id} className="overflow-hidden hover:border-terracotta/30 transition-all hover:shadow-md group">
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-terracotta/10 transition-colors">
                                                <FileText size={18} className="text-slate-400 group-hover:text-terracotta" />
                                            </div>
                                            <h3 className="font-bold text-lg text-taupe leading-snug group-hover:text-terracotta transition-colors">
                                                {result.title}
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setEditingItem(result)}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full text-slate-300 hover:text-terracotta hover:bg-slate-100 transition-all"
                                                title="編集"
                                            >
                                                <Edit size={14} />
                                            </button>
                                            <span className="text-[10px] font-bold tracking-tighter text-slate-300 bg-slate-50 px-2 py-1 rounded-full">
                                                SCORE: {result.score.toFixed(0)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-sm text-taupe-light leading-relaxed mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100 font-medium">
                                        {result.content}
                                    </div>

                                    <div className="flex justify-end pt-4 border-t border-slate-50">
                                        <Link href={`/?message=${encodeURIComponent(result.title + "について教えて")}`}>
                                            <Button variant="outline" className="h-8 text-[11px] font-extrabold tracking-widest uppercase">
                                                <MessageSquare size={14} className="mr-2" />
                                                Discuss with AI
                                                <ChevronRight size={14} className="ml-1" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Empty State / Welcome Screen */}
                    {!isLoading && results.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-300 gap-4">
                            <div className="p-6 bg-slate-100/50 rounded-full">
                                <Search size={40} strokeWidth={1} />
                            </div>
                            <p className="text-sm font-medium">
                                {query ? "No results found for your query." : "Search the knowledge base for reliable answers."}
                            </p>
                        </div>
                    )}
                </div>
                {/* Edit Modal */}
                {editingItem && (
                    <KnowledgeClipModal
                        isOpen={!!editingItem}
                        onClose={() => setEditingItem(null)}
                        onSubmit={handleEditSubmit}
                        initialData={{
                            memo: editingItem.content,
                            tag: editingItem.tags?.[0] || '',
                            author: editingItem.author || 'self'
                        }}
                    />
                )}
            </main>

            {/* Design System Reference: Vercel / Linear / Notion / Algolia */}
        </div>
    );
}
