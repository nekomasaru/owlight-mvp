'use client';

import React, { useState, useEffect } from 'react';
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
    Edit,
    Folder,
    Download,
    Star,
    Eye,
    User,
    HelpCircle,
    TrendingUp,
    LayoutGrid,
    Briefcase,
    Scale,
    Monitor,
    Baby,
    ShieldCheck,
    Plus
} from 'lucide-react';
import KnowledgeClipModal from '@/components/KnowledgeClipModal';
import { useToast } from '@/contexts/ToastContext';
import { useUser } from '@/contexts/UserContext';
import UserSwitcher from '@/components/UserSwitcher';

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

const Card = ({ children, className = "", ...props }: { children: React.ReactNode, className?: string } & React.HTMLAttributes<HTMLDivElement>) => (
    <div className={`rounded-xl bg-card text-foreground shadow-sm ${className}`} {...props}>
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
    trustTier?: string;
    isFavorite?: boolean;
    viewCount?: number;
};

type FileResult = {
    name: string;
    url: string;
    size?: string;
    type?: string;
    uploadedAt?: string;
};

export default function SearchPage() {
    const { user } = useUser(); // Use Context
    const { showSuccess, showError } = useToast();
    const [activeTab, setActiveTab] = useState<'knowledge' | 'file'>('knowledge');
    const [query, setQuery] = useState('');

    // Knowledge Results
    const [results, setResults] = useState<SearchResult[]>([]);

    // File Results
    const [fileResults, setFileResults] = useState<FileResult[]>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editingItem, setEditingItem] = useState<SearchResult | null>(null);

    const handleSearch = async (e?: React.FormEvent<HTMLFormElement>) => {
        if (e) e.preventDefault();
        // Allow empty query for initial load of files? Maybe not.

        setIsLoading(true);
        setError(null);

        try {
            if (activeTab === 'knowledge') {
                setResults([]);
                if (!query.trim()) {
                    // Empty query logic? 
                    // Just return or fetch top?
                    // Let's use existing logic -> /api/search?q=
                }
                const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { cache: 'no-store' });
                if (!response.ok) throw new Error('検索エラー');
                const data = await response.json();
                setResults(data.results || []);
            } else {
                setFileResults([]);
                // Files: Fetch all and filter (MVP)
                // Assuming /api/files returns list of { name, url, ... }
                const response = await fetch('/api/files');
                if (!response.ok) throw new Error('ファイルリスト取得エラー');
                const data = await response.json();
                // data.files or data?
                // Usually admin/files uses data.files
                const files = Array.isArray(data) ? data : (data.files || []);

                if (query.trim()) {
                    const filtered = files.filter((f: any) =>
                        !f.name.endsWith('.json') &&
                        !f.name.startsWith('req_') &&
                        f.name.toLowerCase().includes(query.toLowerCase())
                    );
                    setFileResults(filtered);
                } else {
                    const filtered = files.filter((f: any) =>
                        !f.name.endsWith('.json') &&
                        !f.name.startsWith('req_')
                    );
                    setFileResults(filtered);
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setIsLoading(false);
        }
    };

    // Initial Fetch when Tab Changes (Optional, but good for Files)
    useEffect(() => {
        if (activeTab === 'file' && fileResults.length === 0) {
            handleSearch();
        } else if (activeTab === 'knowledge' && results.length === 0) {
            // Initial knowledge fetch (existing logic)
            const fetchInitialKnowledge = async () => {
                // ... reuse existing fetch logic or call handleSearch('')
                // Existing logic was explicit fetch in useEffect
                setIsLoading(true);
                try {
                    const res = await fetch('/api/search?q=');
                    const data = await res.json();
                    if (data.results) {
                        const mapped = data.results.map((doc: any) => ({
                            id: doc.id,
                            title: doc.title || '無題のナレッジ',
                            content: doc.content || '',
                            score: doc.score || 0,
                            tags: doc.tags || [],
                            author: doc.author || '不明',
                            trustTier: doc.trustTier
                        }));
                        setResults(mapped);
                    }
                } catch (e) { console.error(e); } finally { setIsLoading(false); }
            };
            fetchInitialKnowledge();
        }
    }, [activeTab]);

    const toggleFavorite = (id: string) => {
        setResults(prev => prev.map(r => r.id === id ? { ...r, isFavorite: !r.isFavorite } : r));
        // TODO: API call to save favorite
        const result = results.find(r => r.id === id);
        if (result && !result.isFavorite) {
            showSuccess("お気に入りに登録", "ナレッジをブックマークしました。");
        }
    };

    const handleKnowledgeClick = (id: string) => {
        // Just log or navigate for now
        console.log('Clicked knowledge:', id);
    };

    const handleEditSubmit = async (data: any) => {
        if (!editingItem) return;
        try {
            // Update via API (using knowledge endpoint - to be created)
            await fetch('/api/knowledge', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingItem.id,
                    content: data.memo,
                    tags: [data.tag],
                    author: data.author === 'self' ? user.name : data.author,
                    contributorId: user.id
                })
            });
            // Local Update
            setResults(prev => prev.map(r =>
                r.id === editingItem.id
                    ? { ...r, content: data.memo, title: data.tag, tags: [data.tag], author: data.author === 'self' ? user.name : data.author }
                    : r
            ));
            showSuccess("OWLがナレッジを更新しました", "あなたの貢献が記録されました！");
        } catch (e) {
            console.error(e);
            showError("更新できませんでした", "OWLが困惑しています。もう一度お試しください。");
        }
    };

    // --- Mock Data for New Design ---
    const trendingKnowledge = [
        {
            id: 't1',
            title: '令和6年度 旅費精算マニュアル改訂版',
            desc: 'インボイス制度対応に伴う、領収書の保存要件変更点について詳しく解説しています。',
            author: '山田 主査',
            date: '2日前 更新',
            views: 342,
            tags: [{ label: '経理・財務', color: 'bg-blue-100 text-blue-700' }]
        },
        {
            id: 't2',
            title: '生成AI利用ガイドライン v2.0',
            desc: '個人情報の取り扱いや、プロンプト入力時の注意点、禁止事項のまとめ。',
            author: '佐藤 係長',
            date: '1週間前 更新',
            views: 128,
            tags: [{ label: 'IT・セキュリティ', color: 'bg-purple-100 text-purple-700' }]
        }
    ];

    const categories = [
        { label: '経理・財務', icon: <Briefcase size={24} className="text-amber-600" />, color: 'bg-amber-50' },
        { label: '総務・法務', icon: <Scale size={24} className="text-red-600" />, color: 'bg-red-50' },
        { label: 'IT・システム', icon: <Monitor size={24} className="text-blue-600" />, color: 'bg-blue-50' },
        { label: '子育て・福祉', icon: <Baby size={24} className="text-orange-600" />, color: 'bg-orange-50' },
    ];

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans">
            <main className="flex-1 w-full flex flex-col">
                {/* Hero Section (Search) - Shared or Tab Specific? Image implies specific to Knowledge */}
                {/* Tab Switcher - Centered Top */}
                <div className="flex justify-center pt-8 pb-4">
                    <div className="flex bg-muted p-1 rounded-full">
                        <button
                            onClick={() => setActiveTab('knowledge')}
                            className={`px-6 py-2 text-xs font-bold rounded-full transition-all ${activeTab === 'knowledge' ? 'bg-card shadow-sm text-terracotta' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            ナレッジ検索
                        </button>
                        <button
                            onClick={() => setActiveTab('file')}
                            className={`px-6 py-2 text-xs font-bold rounded-full transition-all ${activeTab === 'file' ? 'bg-card shadow-sm text-terracotta' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            ファイル検索
                        </button>
                    </div>
                </div>

                {activeTab === 'knowledge' ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* 1. Hero / Search Area */}
                        <section className="bg-gradient-to-b from-muted/50 to-background py-16 px-4 text-center">
                            <div className="max-w-3xl mx-auto space-y-8">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-16 h-16 bg-white dark:bg-stone-800 rounded-full shadow-premium flex items-center justify-center text-terracotta border-4 border-background">
                                        <Search size={32} strokeWidth={2.5} />
                                    </div>
                                    <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
                                        お探しの知恵は何ですか？
                                    </h1>
                                    <p className="text-muted-foreground text-sm">
                                        組織の全員が持ち寄った、<span className="font-bold text-terracotta mx-1">12,450件</span>のナレッジから検索します
                                    </p>
                                </div>

                                <form onSubmit={handleSearch} className="w-full max-w-2xl relative group mx-auto mt-4">
                                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                                        <Search size={20} className="text-muted-foreground group-focus-within:text-terracotta transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="例：「出張精算 手順」「契約書 雛形」..."
                                        className="w-full h-16 pl-14 pr-32 rounded-2xl bg-white dark:bg-stone-800/80 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-8 focus:ring-terracotta/5 focus:border-terracotta shadow-md transition-all font-medium"
                                        disabled={isLoading}
                                    />
                                    <div className="absolute right-3 top-3">
                                        <Button
                                            type="submit"
                                            className="h-10 px-6 rounded-xl font-bold bg-terracotta hover:bg-terracotta/90 text-white shadow-sm"
                                            disabled={isLoading}
                                        >
                                            検索
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </section>

                        {/* 2. Main Content Grid */}
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                            {/* If searching, show standard results list. If empty query (Dashboard mode), show suggested layout */}
                            {query && results.length > 0 ? (
                                <div className="space-y-6">
                                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-6">
                                        <Sparkles size={20} className="text-terracotta" />
                                        検索結果 ({results.length}件)
                                    </h2>
                                    <div className="grid gap-4 max-w-4xl mx-auto">
                                        {results.map((result) => (
                                            <Card key={result.id} className="p-6 hover:border-terracotta/30 transition-all hover:shadow-md cursor-pointer" onClick={() => handleKnowledgeClick(result.id)}>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="font-bold text-lg text-foreground mb-2 group-hover:text-terracotta transition-colors">{result.title}</h3>
                                                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{result.content}</p>
                                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                            <div className="flex items-center gap-1"><BookOpen size={14} /> {result.tags?.join(', ') || 'No Tag'}</div>
                                                            <div className="flex items-center gap-1"><User size={14} /> {result.author}</div>
                                                        </div>
                                                    </div>
                                                    <span className="text-xs font-bold bg-muted px-2 py-1 rounded text-muted-foreground">SCORE: {result.score.toFixed(0)}</span>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                                    {/* Left Column (Trending & Categories) */}
                                    <div className="lg:col-span-2 space-y-12">

                                        {/* Trending Section */}
                                        <section>
                                            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-6">
                                                <TrendingUp size={20} className="text-terracotta" /> 今、読まれているナレッジ
                                            </h2>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {trendingKnowledge.map((item) => (
                                                    <Card key={item.id} className="p-6 hover:shadow-md transition-all cursor-pointer group hover:border-terracotta/30">
                                                        <div className="flex flex-wrap gap-2 mb-3">
                                                            {item.tags.map((tag, idx) => (
                                                                <span key={idx} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tag.color} bg-opacity-10`}>
                                                                    {tag.label}
                                                                </span>
                                                            ))}
                                                            <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
                                                                <Eye size={12} /> {item.views}
                                                            </span>
                                                        </div>
                                                        <h3 className="font-bold text-base text-foreground mb-2 leading-snug group-hover:text-terracotta transition-colors">
                                                            {item.title}
                                                        </h3>
                                                        <p className="text-xs text-muted-foreground/80 mb-4 leading-relaxed">
                                                            {item.desc}
                                                        </p>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-4 border-t border-border/50">
                                                            <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] overflow-hidden">
                                                                <User size={12} className="text-slate-500" />
                                                            </div>
                                                            <span>{item.author}</span>
                                                            <span className="text-border">•</span>
                                                            <span>{item.date}</span>
                                                        </div>
                                                    </Card>
                                                ))}
                                            </div>
                                        </section>

                                        {/* Categories Section */}
                                        <section>
                                            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-6">
                                                <LayoutGrid size={20} className="text-terracotta" /> カテゴリから探す
                                            </h2>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                {categories.map((cat, idx) => (
                                                    <div key={idx} className="bg-card hover:bg-muted/50 border border-border rounded-xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all hover:scale-105 hover:shadow-sm text-center">
                                                        <div className="mb-1 p-2 bg-background rounded-full">{cat.icon}</div>
                                                        <span className="text-xs font-bold text-foreground">{cat.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>

                                    </div>

                                    {/* Right Sidebar */}
                                    <div className="lg:col-span-1 space-y-6">

                                        {/* Ace of the Month */}
                                        <Card className="p-0 overflow-hidden border-border/60 relative">
                                            <div className="bg-gradient-to-tr from-amber-50 to-orange-50 dark:from-stone-800 dark:to-stone-700 p-8 flex flex-col items-center text-center">
                                                <div className="absolute top-4 right-4 bg-terracotta text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                                                    今月のAce
                                                </div>
                                                <div className="w-20 h-20 rounded-full bg-stone-800 border-4 border-white dark:border-stone-600 shadow-md mb-4 overflow-hidden relative flex items-center justify-center">
                                                    {/* Avatar Placeholder */}
                                                    <User size={40} className="text-white/50" />
                                                </div>
                                                <h3 className="font-bold text-lg text-foreground">田中 課長</h3>
                                                <p className="text-xs text-muted-foreground mb-1">市民税課</p>
                                                <p className="text-[10px] font-bold text-terracotta bg-terracotta/10 px-2 py-0.5 rounded-full mb-6">
                                                    獲得感謝数: 1,203 Thanks
                                                </p>

                                                <div className="bg-white/60 dark:bg-black/20 rounded-xl p-4 w-full">
                                                    <p className="text-xs text-muted-foreground italic leading-relaxed">
                                                        "新人研修用の資料が非常にわかりやすく、他課でも活用させていただきました！"
                                                    </p>
                                                </div>
                                            </div>
                                        </Card>

                                        {/* Request Box */}
                                        <div className="bg-[#FFF9F5] rounded-2xl p-6 border border-[#F5E6DE]">
                                            <div className="flex flex-col gap-4">
                                                <div className="flex items-start gap-3">
                                                    <ShieldCheck size={24} className="text-[#8B5E3C] shrink-0 mt-0.5" />
                                                    <div>
                                                        <h3 className="font-bold text-base text-[#6D4C41] mb-1">
                                                            ナレッジが見つかりませんか？
                                                        </h3>
                                                        <p className="text-xs text-[#8D6E63] leading-relaxed">
                                                            依頼を作成するだけで <span className="font-bold text-[#D97757]">+30pt</span> 獲得。組織の知恵を借りましょう。
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="mt-2 border-2 border-dashed border-[#E8D4C8] rounded-xl p-2 flex justify-center bg-white/50">
                                                    <Button variant="primary" className="w-full bg-[#A0522D] hover:bg-[#8B4513] text-white font-bold rounded-lg h-10 shadow-sm flex items-center justify-center gap-2">
                                                        <Plus size={18} />
                                                        依頼を作成
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    // --- Legacy/Existing File Search Tab ---
                    <div className="max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-12 flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Search Bar Section for Files */}
                        <div className="flex flex-col items-center text-center gap-6">
                            <div className="p-4 bg-terracotta/10 rounded-3xl text-terracotta">
                                <Folder size={40} strokeWidth={1.5} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2 font-display">
                                    ファイル検索
                                </h1>
                                <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
                                    アップロードされた各種ドキュメントを検索します。
                                </p>
                            </div>

                            <form onSubmit={handleSearch} className="w-full max-w-2xl relative group mt-4">
                                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                                    <Search size={20} className="text-muted-foreground group-focus-within:text-terracotta transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="ファイル名を入力..."
                                    className="w-full h-16 pl-14 pr-32 rounded-2xl bg-white dark:bg-stone-800/80 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-8 focus:ring-terracotta/5 focus:border-terracotta shadow-md transition-all font-medium"
                                    disabled={isLoading}
                                />
                                <div className="absolute right-3 top-3">
                                    <Button
                                        type="submit"
                                        className="h-10 px-6 rounded-xl font-bold"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "検索中..." : "検索"}
                                    </Button>
                                </div>
                            </form>
                        </div>

                        {/* File Results */}
                        <div className="flex flex-col gap-6">
                            {fileResults.length > 0 && (
                                <div className="flex items-center justify-between px-2">
                                    <h2 className="text-sm font-bold text-taupe uppercase tracking-widest flex items-center gap-2">
                                        <Sparkles size={16} className="text-terracotta" />
                                        検索結果 ({fileResults.length}件)
                                    </h2>
                                </div>
                            )}

                            <div className="grid gap-6">
                                {fileResults.map((file, idx) => (
                                    <Card key={idx} className="overflow-hidden hover:border-terracotta/30 transition-all hover:shadow-md group">
                                        <div className="p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-blue-50 text-blue-500 rounded-xl">
                                                    <Folder size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-foreground group-hover:text-terracotta transition-colors">{file.name}</h3>
                                                    <p className="text-xs text-muted-foreground">{file.size || 'Unknown size'} • {file.type || 'File'}</p>
                                                </div>
                                            </div>
                                            <a href={`/api/files/download?name=${encodeURIComponent(file.name)}`} target="_blank" rel="noopener noreferrer">
                                                <Button variant="ghost" className="h-9 w-9 p-0 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                                                    <Download size={18} className="text-muted-foreground group-hover:text-terracotta" />
                                                </Button>
                                            </a>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </div>
                )}


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
        </div>
    );
}
