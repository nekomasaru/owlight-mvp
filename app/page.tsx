'use client';

import MorningRitual from '@/components/MorningRitual';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import {
    ArrowLeft,
    TrendingUp,
    Zap,
    Heart,
    Clock,
    Users,
    Activity,
    MessageCircle,
    ShieldCheck,
    HelpCircle,
    LogOut,
    Plus,
    Flame,
    Eye,
    Star,
    Bell,
    ArrowRight,
    Leaf
} from 'lucide-react';
import KnowledgeRequestModal from '@/components/KnowledgeRequestModal';
import ForestVitality from '@/components/Admin/ForestVitality';

import { useToast } from '@/contexts/ToastContext';

// --- Premium Component ---
const PremiumCard = ({ children, className = "", onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => (
    <div onClick={onClick} className={`bg-card rounded-3xl shadow-premium p-8 ${className}`}>
        {children}
    </div>
);

// --- Engagement Page ---
export default function EngagementPage() {
    const { user } = useUser(); // Use Context
    const { showSuccess } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Data is handled by UserContext

    // --- WANTED Logic ---
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState<'overview' | 'wanted' | 'favorites' | 'notifications'>('overview');

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && ['overview', 'wanted', 'favorites', 'notifications'].includes(tab)) {
            setActiveTab(tab as any);
        }
    }, [searchParams]);

    const [wantedList, setWantedList] = useState<any[]>([]);
    const [filter, setFilter] = useState<'all' | 'urgent' | 'normal'>('all');
    const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const [notifications, setNotifications] = useState<any[]>([]);

    useEffect(() => {
        if (activeTab === 'notifications') {
            fetchNotifications();
        } else if (activeTab !== 'overview') {
            fetchWantedList();
        }
    }, [activeTab]);

    const fetchNotifications = async () => {
        try {
            const res = await fetch(`/api/notifications?userId=${user.id}`);
            const data = await res.json();
            setNotifications(data.notifications || []);
        } catch (e) {
            console.error(e);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await fetch(`/api/notifications?id=${id}`, { method: 'PATCH' });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (e) { /* ignore */ }
    };

    // Client-side Sort & Filter
    const filteredList = activeTab === 'notifications' ? [] : wantedList.filter(req => {
        let sd = req.structured_data || {};
        if (typeof sd === 'string') { try { sd = JSON.parse(sd); } catch (e) { } }
        sd = sd || {};

        // Tab Filter
        if (activeTab === 'favorites') {
            const favs = sd.favorites || [];
            if (!favs.includes(user.id)) return false;
        }

        const p = sd.priority || 'normal';
        if (filter === 'urgent') return p === 'urgent';
        if (filter === 'normal') return p !== 'urgent';
        return true;
    }).sort((a, b) => {
        let sdA = a.structured_data || {};
        let sdB = b.structured_data || {};
        if (typeof sdA === 'string') { try { sdA = JSON.parse(sdA); } catch (e) { } }
        if (typeof sdB === 'string') { try { sdB = JSON.parse(sdB); } catch (e) { } }
        sdA = sdA || {};
        sdB = sdB || {};

        // 1. Priority
        const pA = sdA.priority === 'urgent';
        const pB = sdB.priority === 'urgent';
        if (pA && !pB) return -1;
        if (!pA && pB) return 1;

        // 2. Me Too
        return (sdB.me_too_count || 0) - (sdA.me_too_count || 0);
    });

    const fetchWantedList = async () => {
        try {
            const res = await fetch('/api/wanted');
            const data = await res.json();
            setWantedList(data.requests || []);
        } catch (e) {
            console.error(e);
        }
    };

    const handleAction = async (requestId: string, action: 'view' | 'favorite' | 'subscribe') => {
        // Optimistic Update
        setWantedList(prev => prev.map(req => {
            if (req.id !== requestId) return req;
            let sd = req.structured_data || {};
            if (typeof sd === 'string') { try { sd = JSON.parse(sd); } catch (e) { } }
            sd = sd || {};

            let updates = {};
            if (action === 'view') {
                updates = { view_count: (sd.view_count || 0) + 1 };
            } else if (action === 'favorite') {
                const favs = sd.favorites || [];
                updates = { favorites: favs.includes(user.id) ? favs.filter((u: string) => u !== user.id) : [...favs, user.id] };
            } else if (action === 'subscribe') {
                const subs = sd.subscribers || [];
                updates = { subscribers: subs.includes(user.id) ? subs.filter((u: string) => u !== user.id) : [...subs, user.id] };
            }
            return { ...req, structured_data: { ...sd, ...updates } };
        }));

        await fetch('/api/wanted', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: requestId, action, userId: user.id })
        });
    };

    const toggleExpand = (id: string) => {
        if (expandedCardId !== id) {
            handleAction(id, 'view'); // Count view on expand
            setExpandedCardId(id);
        } else {
            setExpandedCardId(null);
        }
    };

    const handleMeToo = async (requestId: string) => {
        try {
            // Optimistic Update
            setWantedList(prev => prev.map(req => {
                if (req.id === requestId) {
                    let sd = req.structured_data;
                    if (typeof sd === 'string') {
                        try { sd = JSON.parse(sd); } catch (e) { sd = {}; }
                    }
                    sd = sd || {};

                    return {
                        ...req,
                        structured_data: {
                            ...sd,
                            me_too_count: (sd.me_too_count || 0) + 1,
                            me_too_users: [...(sd.me_too_users || []), user.id]
                        }
                    };
                }
                return req;
            }));

            // API Call
            await fetch('/api/wanted', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: requestId, action: 'me_too', userId: user.id })
            });

            // Award Points for empathy
            await fetch('/api/points', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'awardPoints', targetUserIds: [user.id], points: 10, thanks: 0 })
            });

        } catch (e) {
            console.error('Me Too failed', e);
            fetchWantedList(); // Revert on error
        }
    };

    const [submissionModalState, setSubmissionModalState] = useState<{
        isOpen: boolean;
        requestId: string | null;
        initialTitle: string;
        initialContent: string;
    }>({
        isOpen: false,
        requestId: null,
        initialTitle: '',
        initialContent: ''
    });

    const handleResolve = async (requestId: string, knowledgeId?: string) => {
        if (!knowledgeId) {
            // Should not happen in new flow, but keep as fallback or dev mode
            if (!confirm('このWANTEDを解決済みにしますか？')) return;
        }

        try {
            // Optimistic Update: Remove from list
            setWantedList(prev => prev.filter(req => req.id !== requestId));

            await fetch('/api/wanted', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: requestId,
                    action: 'resolve',
                    userId: user.id,
                    knowledgeId: knowledgeId // Link if available
                })
            });

            if (knowledgeId) {
                // Already handled in modal callback
            } else {
                showSuccess('WANTED解決', 'あなたの貢献が組織の知恵になりました。ありがとうございます！');
            }

        } catch (e) {
            console.error(e);
            fetchWantedList();
        }
    };

    // --- Draw Network (Modern Minimal) ---
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = canvas.parentElement?.clientWidth || 300;
        canvas.height = 240;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const center = { x: canvas.width / 2, y: canvas.height / 2 };
        const others = [
            { a: 0.1, r: 80 }, { a: 1.5, r: 90 }, { a: 3.2, r: 75 }, { a: 4.8, r: 85 }
        ];

        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = 'rgba(141, 166, 119, 0.2)';
        others.forEach(o => {
            const x = center.x + Math.cos(o.a) * o.r;
            const y = center.y + Math.sin(o.a) * o.r;
            ctx.beginPath();
            ctx.moveTo(center.x, center.y);
            ctx.lineTo(x, y);
            ctx.stroke();

            ctx.fillStyle = 'rgba(141, 166, 119, 0.1)';
            ctx.beginPath();
            ctx.arc(x, y, 10, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.setLineDash([]);
        ctx.fillStyle = '#B35E3F';
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(179, 94, 63, 0.4)';
        ctx.beginPath();
        ctx.arc(center.x, center.y, 20, 0, Math.PI * 2);
        ctx.fill();
    }, [isLoading]);

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans pb-20 overflow-x-hidden text-foreground">
            <Suspense fallback={null}>
                <MorningRitual />
            </Suspense>

            <main className="max-w-7xl mx-auto px-8 py-8 space-y-12">

                {/* --- Stats / Tab Switcher --- */}
                <div className="flex items-center justify-center mb-8">
                    <div className="bg-card/50 backdrop-blur-sm p-1 rounded-full shadow-sm flex gap-1">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${activeTab === 'overview'
                                ? 'bg-terracotta text-white shadow-md'
                                : 'text-muted-foreground hover:bg-muted'
                                }`}
                        >
                            概要
                        </button>
                        <button
                            onClick={() => setActiveTab('wanted')}
                            className={`px-6 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'wanted'
                                ? 'bg-terracotta text-white shadow-md'
                                : 'text-taupe-light hover:bg-white/50'
                                }`}
                        >
                            ナレッジ募集
                        </button>
                        <button
                            onClick={() => setActiveTab('favorites')}
                            className={`px-6 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'favorites'
                                ? 'bg-terracotta text-white shadow-md'
                                : 'text-taupe-light hover:bg-white/50'
                                }`}
                        >
                            お気に入り <Star size={12} className={activeTab === 'favorites' ? "fill-white" : ""} />
                        </button>
                        <button
                            onClick={() => setActiveTab('notifications')}
                            className={`px-6 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'notifications'
                                ? 'bg-terracotta text-white shadow-md'
                                : 'text-taupe-light hover:bg-white/50'
                                }`}
                        >
                            履歴 <Bell size={12} className={activeTab === 'notifications' ? "fill-white" : ""} />
                        </button>
                    </div>
                </div>

                {activeTab === 'overview' ? (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* --- 1. Forest Vitality Hero --- */}
                        <div className="w-full">
                            <ForestVitality />
                        </div>

                        {/* --- 2. Metrics Grid --- */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <PremiumCard className="relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5"><Zap size={40} /></div>
                                <span className="text-[10px] font-black text-taupe-light/50 uppercase tracking-[0.2em] block mb-4">これまで獲得したOWL Point</span>
                                <div className="text-6xl font-thin tracking-tighter mb-2">{user.points}</div>
                                <div className="flex items-center gap-2 text-sage text-xs font-bold">
                                    <TrendingUp size={14} /> +12.4% <span className="text-taupe-light/50 font-normal">先月比</span>
                                </div>
                            </PremiumCard>

                            <PremiumCard className="relative overflow-hidden bg-terracotta/5">
                                <div className="absolute top-0 right-0 p-4 opacity-10 text-terracotta"><Clock size={40} /></div>
                                <span className="text-[10px] font-black text-terracotta/60 uppercase tracking-[0.2em] block mb-4">創出された時間 (Time Saved)</span>
                                <div className="text-6xl font-thin tracking-tighter mb-2 text-terracotta">{user.timeSaved}h</div>
                                <p className="text-[10px] text-taupe-light font-medium tracking-wide">
                                    組織全体で創出された「余裕」の時間。
                                </p>
                            </PremiumCard>

                            <PremiumCard className="relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5"><Heart size={40} /></div>
                                <span className="text-[10px] font-black text-taupe-light/50 uppercase tracking-[0.2em] block mb-4">受け取った感謝</span>
                                <div className="text-6xl font-thin tracking-tighter mb-2">{user.thanksCount}</div>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className="w-1.5 h-1.5 bg-terracotta rounded-full"></div>
                                    ))}
                                </div>
                            </PremiumCard>
                        </div>

                        {/* --- 3. Bottom Sections --- */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

                            {/* Activity Feed (Reaction Stream) */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-bold text-taupe flex items-center gap-2">
                                    <Bell size={16} className="text-taupe-light" />
                                    最近届いたリアクション
                                </h3>
                                <div className="space-y-4">
                                    {/* 1. Knowledge Used (Shield) */}
                                    <div className="flex gap-4 items-start p-6 bg-amber-50/50 rounded-[1.5rem] border-l-4 border-amber-400 hover:shadow-md transition-all">
                                        <div className="p-3 rounded-full bg-amber-100 text-amber-600 shrink-0">
                                            <ShieldCheck size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-taupe mb-1">あなたのナレッジが誰かの役に立ちました</h4>
                                            <p className="text-xs text-taupe-light leading-relaxed">
                                                あなたのナレッジが、本日1件のリスクをブロックしました。
                                            </p>
                                            <span className="text-[10px] font-bold text-taupe-light/40 mt-2 block">30分前</span>
                                        </div>
                                    </div>

                                    {/* 2. Help Needed (Ghost/Dropout) - BRAND NEW */}
                                    <div className="flex gap-4 items-start p-6 bg-purple-50/50 rounded-[1.5rem] border-l-4 border-purple-400 hover:shadow-md transition-all group cursor-pointer relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <HelpCircle size={60} className="text-purple-500" />
                                        </div>
                                        <div className="p-3 rounded-full bg-purple-100 text-purple-600 shrink-0 relative z-10">
                                            <span className="text-xl">👻</span>
                                        </div>
                                        <div className="relative z-10">
                                            <h4 className="text-sm font-bold text-purple-900 mb-1">助けが必要です</h4>
                                            <p className="text-xs text-purple-800/80 leading-relaxed mb-3">
                                                誰かが<span className="font-bold underline">「児童手当 特例」</span>を検索しましたが、答えが見つからず離脱しました。
                                            </p>
                                            <button className="flex items-center gap-1 text-[10px] font-bold bg-white/80 text-purple-700 px-3 py-1.5 rounded-full shadow-sm hover:bg-white hover:scale-105 transition-all">
                                                <span>知恵を貸す (+50pt)</span>
                                                <ArrowRight size={10} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* 3. Thanks Received */}
                                    <div className="flex gap-4 items-start p-6 bg-white rounded-[1.5rem] border border-slate-100 hover:shadow-md transition-all">
                                        <div className="p-3 rounded-full bg-terracotta/10 text-terracotta shrink-0">
                                            <Heart size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-taupe mb-1">佐藤 (市民課) さんから「感謝」が届きました</h4>
                                            <p className="text-xs text-taupe-light leading-relaxed mb-1">
                                                理由: 思考プロセスが明確で参考になった
                                            </p>
                                            <span className="text-[10px] font-bold text-taupe-light/40">2分前</span>
                                        </div>
                                    </div>

                                    {/* 4. Viewed */}
                                    <div className="flex gap-4 items-start p-6 bg-white rounded-[1.5rem] border border-slate-100 hover:shadow-md transition-all">
                                        <div className="p-3 rounded-full bg-slate-100 text-slate-500 shrink-0">
                                            <Eye size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-taupe mb-1">鈴木 (建設課) さんがあなたの投稿を閲覧しました</h4>
                                            <p className="text-xs text-taupe-light leading-relaxed mb-1">
                                                記事: 「検査合格前の支払リスク」
                                            </p>
                                            <span className="text-[10px] font-bold text-taupe-light/40">1時間前</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Network Overlay (Circle of Thanks) */}
                            <div className="space-y-6">
                                <div className="flex justify-between items-end">
                                    <h3 className="text-sm font-bold text-taupe flex items-center gap-2">
                                        <Users size={16} className="text-taupe-light" />
                                        感謝の輪
                                    </h3>
                                    <span className="text-[10px] text-taupe-light">あなたの知恵が誰に届いたか</span>
                                </div>

                                <PremiumCard className="relative h-[480px] flex items-center justify-center overflow-hidden bg-slate-50/50">
                                    {/* Connection Map (SVG + HTML) */}
                                    <div className="relative w-full h-full flex items-center justify-center">
                                        {/* Connecting Lines (SVG layer) */}
                                        <svg className="absolute inset-0 w-full h-full pointer-events-none">
                                            <defs>
                                                <marker id="arrow" markerWidth="10" markerHeight="10" refX="28" refY="3" orient="auto" markerUnits="strokeWidth">
                                                    <path d="M0,0 L0,6 L9,3 z" fill="#D4C5B8" />
                                                </marker>
                                            </defs>
                                            {/* Lines to nodes */}
                                            <g stroke="#E5E0DC" strokeWidth="2">
                                                <line x1="50%" y1="50%" x2="50%" y2="20%" />{/* Top: Watanabe */}
                                                <line x1="50%" y1="50%" x2="80%" y2="50%" />{/* Right: Tanaka */}
                                                <line x1="50%" y1="50%" x2="65%" y2="80%" />{/* Bottom Right: Suzuki */}
                                                <line x1="50%" y1="50%" x2="35%" y2="80%" />{/* Bottom Left: Sato */}
                                                <line x1="50%" y1="50%" x2="25%" y2="40%" />{/* Left: Ito */}
                                            </g>
                                        </svg>

                                        {/* Center Node (You) */}
                                        <div className="absolute z-10 w-24 h-24 bg-white rounded-full border-4 border-terracotta shadow-xl flex flex-col items-center justify-center animate-[pulse_4s_infinite]">
                                            <span className="text-xs font-bold text-taupe">あなた</span>
                                            <span className="text-[9px] text-terracotta font-black mt-1">LV.42</span>
                                        </div>

                                        {/* Surrounding Nodes */}
                                        {/* Top: Watanabe */}
                                        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full border-2 border-sage/50 shadow-md flex items-center justify-center hover:scale-110 transition-transform cursor-pointer group">
                                            <span className="text-[10px] font-bold text-taupe">渡辺</span>
                                            <div className="absolute -top-8 bg-sage text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">感謝 +2</div>
                                        </div>

                                        {/* Right: Tanaka */}
                                        <div className="absolute top-1/2 right-[20%] translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full border-2 border-sage/50 shadow-md flex items-center justify-center hover:scale-110 transition-transform cursor-pointer group">
                                            <span className="text-[10px] font-bold text-taupe">田中</span>
                                        </div>

                                        {/* Bottom Right: Suzuki */}
                                        <div className="absolute bottom-[20%] right-[35%] translate-x-1/2 translate-y-1/2 w-16 h-16 bg-white rounded-full border-2 border-sage/50 shadow-md flex items-center justify-center hover:scale-110 transition-transform cursor-pointer group">
                                            <span className="text-[10px] font-bold text-taupe">鈴木</span>
                                        </div>

                                        {/* Bottom Left: Sato (Key person) */}
                                        <div className="absolute bottom-[20%] left-[35%] -translate-x-1/2 translate-y-1/2 w-16 h-16 bg-white rounded-full border-2 border-sage/50 shadow-md flex items-center justify-center hover:scale-110 transition-transform cursor-pointer group">
                                            <span className="text-[10px] font-bold text-taupe">佐藤</span>
                                            <Heart size={12} className="absolute -top-1 -right-1 text-terracotta bg-white rounded-full fill-terracotta" />
                                        </div>

                                        {/* Left: Ito */}
                                        <div className="absolute top-[40%] left-[25%] -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full border-2 border-sage/50 shadow-md flex items-center justify-center hover:scale-110 transition-transform cursor-pointer group">
                                            <span className="text-[10px] font-bold text-taupe">伊藤</span>
                                        </div>
                                    </div>
                                </PremiumCard>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* --- WANTED TAB CONTENT --- */
                    /* --- WANTED TAB CONTENT --- */
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

                        {/* Filter & New Request Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                            {activeTab === 'wanted' ? (
                                <div className="flex gap-2 bg-slate-100/50 p-1 rounded-lg w-fit">
                                    {[
                                        { id: 'all', label: 'すべて' },
                                        { id: 'urgent', label: '緊急のみ 🔥' },
                                        { id: 'normal', label: '通常' }
                                    ].map((f) => (
                                        <button
                                            key={f.id}
                                            onClick={() => setFilter(f.id as any)}
                                            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${filter === f.id ? 'bg-white shadow-sm text-taupe' : 'text-taupe-light hover:bg-white/50'}`}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                            ) : <div />}

                            <div className="flex gap-3">
                                {/* Buttons Removed */}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* ... Promotion Card ... */}
                            {/* ... */}

                            {activeTab === 'notifications' ? (
                                <div className="col-span-full space-y-4">
                                    {notifications.length === 0 ? (
                                        <div className="py-20 text-center text-taupe-light">
                                            <p className="font-bold text-lg mb-2">通知はありません</p>
                                            <p className="text-xs">平和な一日です。</p>
                                        </div>
                                    ) : (
                                        notifications.map((notif) => (
                                            <div
                                                key={notif.id}
                                                className={`p-6 rounded-2xl border transition-all flex items-start gap-4 cursor-pointer ${notif.isRead ? 'bg-white opacity-60' : 'bg-white border-terracotta/20 shadow-premium'}`}
                                                onClick={() => markAsRead(notif.id)}
                                            >
                                                <div className={`p-2 rounded-lg ${notif.type === 'knowledge_update' ? 'bg-terracotta text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                    <Bell size={20} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <h4 className="text-sm font-bold text-taupe">{notif.title}</h4>
                                                        <span className="text-[10px] text-taupe-light/50 font-bold">
                                                            {new Date(notif.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-taupe-light leading-relaxed mb-3">{notif.body}</p>
                                                    {notif.linkUrl && (
                                                        <Link href={notif.linkUrl}>
                                                            <span className="text-[10px] font-bold text-terracotta hover:underline">内容を確認する →</span>
                                                        </Link>
                                                    )}
                                                </div>
                                                {!notif.isRead && <div className="w-2 h-2 rounded-full bg-terracotta mt-2" />}
                                            </div>
                                        ))
                                    )}
                                </div>
                            ) : (
                                <>
                                    {/* New Request Promotion Card */}
                                    <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-gradient-to-r from-terracotta/5 to-transparent p-6 rounded-[2rem] border border-terracotta/10 border-dashed mb-4 flex items-center justify-between">
                                        <div>
                                            <h3 className="text-sm font-bold text-taupe flex items-center gap-2">
                                                <ShieldCheck size={16} className="text-terracotta" />
                                                ナレッジが見つかりませんか？
                                            </h3>
                                            <p className="text-xs text-taupe-light mt-1">
                                                依頼を作成するだけで <span className="font-bold text-terracotta">+30pt</span> 獲得。組織の知恵を借りましょう。
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setIsCreateModalOpen(true)}
                                            className="px-4 py-2 rounded-xl border-2 border-dashed border-terracotta/30 flex items-center gap-2 text-terracotta hover:bg-terracotta/5 transition-colors group text-xs font-bold bg-white/50"
                                        >
                                            <div className="bg-terracotta text-white p-0.5 rounded-md group-hover:scale-110 transition-transform">
                                                <Plus size={14} />
                                            </div>
                                            <span>依頼を作成</span>
                                        </button>
                                    </div>

                                    {filteredList.length === 0 ? (
                                        <div className="col-span-full py-20 text-center text-taupe-light">
                                            <p className="font-bold text-lg mb-2">
                                                {activeTab === 'favorites' ? 'ブックマークしたナレッジ' : '条件に一致するナレッジはありません'}
                                            </p>
                                            <p className="text-xs">
                                                {activeTab === 'favorites' ? '検索やWANTEDから、役立つ情報をお気に入りに登録できます。' : '平和な一日です。'}
                                            </p>
                                        </div>
                                    ) : (
                                        filteredList.map((req) => {
                                            const isMeToo = (req.structured_data?.me_too_users || []).includes(user.id);
                                            const isFav = (req.structured_data?.favorites || []).includes(user.id);
                                            const isSub = (req.structured_data?.subscribers || []).includes(user.id);
                                            const viewCount = req.structured_data?.view_count || 0;
                                            const isExpanded = expandedCardId === req.id;

                                            return (
                                                <PremiumCard key={req.id} className={`group hover:-translate-y-1 transition-all duration-300 ${req.structured_data?.priority === 'urgent' ? '!bg-red-50 !border-4 !border-red-500 shadow-none' : 'bg-white hover:shadow-premium'}`}>
                                                    <div className="flex justify-between items-start mb-4 relative">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`p-2 rounded-lg ${req.structured_data?.priority === 'urgent' ? 'bg-red-100 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                                                                {req.structured_data?.priority === 'urgent' ? <Flame size={20} className="fill-red-600" /> : <HelpCircle size={20} />}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded w-fit ${req.structured_data?.priority === 'urgent' ? 'bg-red-100 text-red-600' : 'bg-amber-50 text-amber-500'}`}>
                                                                    {req.structured_data?.priority === 'urgent' ? 'URGENT 🔥' : 'WANTED'}
                                                                </span>
                                                                <span className="flex items-center gap-1 text-[9px] text-taupe-light ml-1 font-bold">
                                                                    <Eye size={10} /> {viewCount}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-[10px] font-bold text-taupe-light block">獲得報酬</span>
                                                            <span className="text-lg font-black text-terracotta tracking-tighter">
                                                                {50 + (req.structured_data?.me_too_count || 0) * 10} <span className="text-xs">pt</span>
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <h3 className="text-lg font-bold text-taupe mb-2 tracking-tight line-clamp-2 min-h-[3.5rem]">
                                                        {req.title}
                                                    </h3>
                                                    <div className={`text-xs text-taupe-light leading-relaxed mb-6 transition-all duration-300 ${isExpanded ? '' : 'line-clamp-3 h-[4.5em]'}`}>
                                                        {req.content}
                                                    </div>

                                                    <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-auto">
                                                        <div className="flex items-center gap-4 text-xs font-bold text-taupe-light">
                                                            <button
                                                                onClick={() => handleMeToo(req.id)}
                                                                disabled={isMeToo}
                                                                className={`flex items-center gap-1 transition-colors ${isMeToo ? 'text-terracotta cursor-default' : 'hover:text-terracotta'}`}
                                                            >
                                                                <Users size={14} className={isMeToo ? "fill-terracotta" : ""} />
                                                                <span>{req.structured_data?.me_too_count || 0}</span>
                                                                <span className="text-[9px] opacity-70">Me Too</span>
                                                            </button>

                                                            {/* Favorite */}
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleAction(req.id, 'favorite'); }}
                                                                className={`p-2 rounded-full transition-colors ${isFav ? 'text-amber-400 bg-amber-50' : 'text-slate-400 hover:text-amber-400 hover:bg-amber-50'}`}
                                                                title="お気に入り"
                                                            >
                                                                <Star size={16} className={isFav ? "fill-amber-400" : ""} />
                                                            </button>

                                                            {/* Subscribe */}
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleAction(req.id, 'subscribe'); }}
                                                                className={`p-2 rounded-full transition-colors ${isSub ? 'text-blue-500 bg-blue-50' : 'text-slate-400 hover:text-blue-500 hover:bg-blue-50'}`}
                                                                title="更新通知を受け取る"
                                                            >
                                                                <Bell size={16} className={isSub ? "fill-blue-500" : ""} />
                                                            </button>
                                                        </div>

                                                        <button
                                                            onClick={() => {
                                                                setSubmissionModalState({
                                                                    isOpen: true,
                                                                    requestId: req.id,
                                                                    initialTitle: `【解決】${req.title}`,
                                                                    initialContent: `解決策:\n\n---\n元のWANTED:\n${req.content}`
                                                                });
                                                            }}
                                                            className="px-4 py-2 bg-taupe text-white text-xs font-bold rounded-lg hover:bg-taupe-dark transition-colors shadow-lg shadow-taupe/20"
                                                        >
                                                            解決する (作成)
                                                        </button>
                                                    </div>
                                                </PremiumCard>
                                            );
                                        })
                                    )}
                                </>
                            )}
                        </div>

                        <KnowledgeRequestModal
                            isOpen={isCreateModalOpen}
                            onClose={() => setIsCreateModalOpen(false)}
                            messages={[]}
                            onCreated={fetchWantedList}
                            mode="request"
                        />

                        <KnowledgeRequestModal
                            isOpen={submissionModalState.isOpen}
                            onClose={() => setSubmissionModalState(prev => ({ ...prev, isOpen: false }))}
                            messages={[]}
                            initialTitle={submissionModalState.initialTitle}
                            initialContent={submissionModalState.initialContent}
                            mode="submit_knowledge"
                            onCreated={(knowledgeId) => {
                                if (knowledgeId && submissionModalState.requestId) {
                                    handleResolve(submissionModalState.requestId, knowledgeId);
                                }
                                setSubmissionModalState(prev => ({ ...prev, isOpen: false }));
                                fetchWantedList();
                            }}
                        />
                    </div>
                )}
            </main >
        </div >
    );
}
