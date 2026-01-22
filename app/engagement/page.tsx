'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useUser } from '@/contexts/UserContext';
import UserSwitcher from '@/components/UserSwitcher'; // Added // Added
import {
    ArrowLeft,
    TrendingUp,
    Zap,
    Heart,
    Trophy,
    Clock,
    Users,
    Activity,
    ChevronRight,
    MessageCircle,
    ShieldCheck,
    HelpCircle,
    LogOut
} from 'lucide-react';

// --- Premium Component ---
const PremiumCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`bg-white rounded-3xl shadow-premium border border-white/50 p-8 ${className}`}>
        {children}
    </div>
);

// --- Engagement Page ---
export default function EngagementPage() {
    const { user } = useUser(); // Use Context
    const [points, setPoints] = useState<number>(0);
    const [timeSaved, setTimeSaved] = useState<number>(0);
    const [thanksCount, setThanksCount] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);

    // const user = { name: 'Taro', dept: '市民生活部 / 市民課' }; // Removed hardcoded
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // --- Firebase Sync ---
    useEffect(() => {
        const userDocRef = doc(db, 'users', user.id); // Dynamic ID
        const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
                const data = docSnapshot.data();
                setPoints(data.points || 0);
                setTimeSaved(Math.floor(((data.points || 0) * 15) / 60));
                setThanksCount(data.thanksCount || 12);
                setIsLoading(false);
                setIsLoading(false);
            } else {
                setDoc(userDocRef, { name: user.name, points: user.points, thanksCount: 3 });
            }
        });
        return () => unsubscribe();
    }, [user.id]);

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
        <div className="min-h-screen bg-background text-taupe font-sans antialiased pb-20 overflow-x-hidden">

            {/* Nav */}
            <header className="fixed top-0 z-40 w-full bg-white/70 backdrop-blur-xl border-b border-white/20 px-8 h-16 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/">
                        <div className="p-2 hover:bg-taupe/5 rounded-2xl transition-all">
                            <ArrowLeft size={18} />
                        </div>
                    </Link>
                    <div className="flex flex-col">
                        <h1 className="text-sm font-bold tracking-tight">ナレッジ活用分析</h1>
                        <span className="text-[8px] font-black text-taupe-light/50 tracking-widest uppercase">所属: {user.department}</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <UserSwitcher />
                    <Link href="/closing">
                        <button className="p-2 text-taupe-light hover:text-terracotta transition-colors" title="業務終了">
                            <LogOut size={18} />
                        </button>
                    </Link>
                    <div className="flex items-center gap-3 bg-white px-4 py-1.5 rounded-full shadow-premium border border-white">
                        <img src="/Mr.OWL.jpg" className="w-6 h-6 rounded-full object-cover border border-terracotta" />
                        <span className="text-[10px] font-black uppercase text-terracotta">2026年 登録</span>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-8 pt-24 space-y-12">

                {/* --- 1. Abstract Wisdom Visualization --- */}
                <section className="relative overflow-hidden bg-white rounded-[3rem] shadow-premium p-12 flex flex-col lg:flex-row items-center gap-16">
                    <div className="absolute top-[-100px] right-[-100px] w-96 h-96 bg-sage/5 rounded-full blur-[100px] pointer-events-none"></div>

                    {/* The "Tree" (Abstract Motion) */}
                    <div className="relative w-72 h-72 flex items-center justify-center">
                        <div className="absolute inset-0 bg-sage/5 rounded-full animate-pulse"></div>
                        <div className="absolute inset-4 border border-sage/10 rounded-full"></div>
                        <div className="absolute inset-12 border-2 border-sage/20 rounded-full animate-[spin_20s_linear_infinite]"></div>

                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-32 h-32 bg-gradient-to-br from-sage to-sage-light rounded-[3rem] rotate-45 flex items-center justify-center shadow-lg">
                                <Activity size={50} className="text-white -rotate-45" />
                            </div>
                            <div className="mt-8 text-center">
                                <span className="block text-[10px] font-black text-sage uppercase tracking-[0.3em]">循環健全度</span>
                                <span className="text-3xl font-thin tracking-tighter">98.4%</span>
                            </div>
                        </div>

                        {/* Orbiting particles */}
                        <div className="absolute top-0 left-1/2 w-4 h-4 bg-terracotta/40 rounded-full shadow-glow"></div>
                        <div className="absolute bottom-10 right-4 w-3 h-3 bg-sage rounded-full"></div>
                    </div>

                    <div className="flex-1 space-y-8 text-center lg:text-left">
                        <div className="space-y-4">
                            <h2 className="text-4xl font-thin tracking-tight leading-tight">
                                ナレッジの森は、現在<br />
                                <span className="font-bold text-terracotta italic underline decoration-terracotta/20 underline-offset-8">最盛期</span>を迎えています。
                            </h2>
                            <p className="text-taupe-light text-sm max-w-lg leading-relaxed font-medium">
                                素晴らしい成果です。あなたのこれまでの貢献により、市民課のナレッジ循環は理想的なサイクルに入っています。
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4">
                            <Link href="/">
                                <button className="px-10 py-5 bg-gradient-to-tr from-terracotta to-terracotta-light text-white font-bold rounded-[2rem] shadow-glow hover:scale-105 transition-all active:scale-95 text-sm tracking-wide flex items-center gap-3">
                                    <MessageCircle size={20} />
                                    OWLくんと対話を始める
                                </button>
                            </Link>
                            <button className="px-6 py-5 bg-taupe/5 hover:bg-taupe/10 text-taupe font-bold rounded-[2rem] transition-all text-[11px] uppercase tracking-widest">
                                データを更新
                            </button>
                        </div>
                    </div>
                </section>

                {/* --- 2. Metrics Grid --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <PremiumCard className="relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5"><Zap size={40} /></div>
                        <span className="text-[10px] font-black text-taupe-light/50 uppercase tracking-[0.2em] block mb-4">獲得ナレッジポイント</span>
                        <div className="text-6xl font-thin tracking-tighter mb-2">{points}</div>
                        <div className="flex items-center gap-2 text-sage text-xs font-bold">
                            <TrendingUp size={14} /> +12.4% <span className="text-taupe-light/50 font-normal">先月比</span>
                        </div>
                    </PremiumCard>

                    <PremiumCard className="relative overflow-hidden bg-terracotta/5">
                        <div className="absolute top-0 right-0 p-4 opacity-10 text-terracotta"><Clock size={40} /></div>
                        <span className="text-[10px] font-black text-terracotta/60 uppercase tracking-[0.2em] block mb-4">創出された時間 (Time Saved)</span>
                        <div className="text-6xl font-thin tracking-tighter mb-2 text-terracotta">{timeSaved}h</div>
                        <p className="text-[10px] text-taupe-light font-medium tracking-wide">
                            組織全体で創出された「余裕」の時間。
                        </p>
                    </PremiumCard>

                    <PremiumCard className="relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5"><Heart size={40} /></div>
                        <span className="text-[10px] font-black text-taupe-light/50 uppercase tracking-[0.2em] block mb-4">受け取った感謝</span>
                        <div className="text-6xl font-thin tracking-tighter mb-2">{thanksCount}</div>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="w-1.5 h-1.5 bg-terracotta rounded-full"></div>
                            ))}
                        </div>
                    </PremiumCard>
                </div>

                {/* --- 3. Bottom Sections --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

                    {/* Activity Feed */}
                    <div className="space-y-6">
                        <h3 className="text-[10px] font-black text-taupe-light/50 uppercase tracking-[0.3em] ml-2">最近の貢献アクティビティ</h3>
                        <div className="space-y-4">
                            {[
                                { icon: <ShieldCheck size={18} />, title: 'リスクを回避', text: '重大な申請不備がナレッジにより未然に防がれました。', time: '34m ago', color: 'bg-sage' },
                                { icon: <HelpCircle size={18} />, title: '支援が必要', text: '誰かが回答に辿り着けず、離脱しました。', time: '2h ago', color: 'bg-amber' },
                                { icon: <Heart size={18} />, title: '感謝を受領', text: '佐藤さんより、提供情報への感謝が届きました。', time: 'Yesterday', color: 'bg-terracotta' },
                            ].map((item, i) => (
                                <div key={i} className="flex gap-6 items-start p-6 bg-white rounded-[2rem] border border-white hover:shadow-premium transition-all">
                                    <div className={`p-3 rounded-2xl ${item.color} text-white shadow-lg`}>
                                        {item.icon}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <h4 className="text-[13px] font-bold tracking-tight">{item.title}</h4>
                                            <span className="text-[9px] font-bold text-taupe-light/40 uppercase">{item.time}</span>
                                        </div>
                                        <p className="text-xs text-taupe-light leading-relaxed">{item.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Leaderboard & Network Overlay */}
                    <div className="space-y-6">
                        <h3 className="text-[10px] font-black text-taupe-light/50 uppercase tracking-[0.1em] ml-2">ナレッジの繋がり (Wisdom Network)</h3>
                        <PremiumCard className="relative h-[480px] flex flex-col">
                            <div className="relative z-10 space-y-6 flex-1">
                                {[
                                    { rank: 1, name: `${user.name} (You)`, pts: points, badge: 'Sage' },
                                    { rank: 2, name: '山田 花子', pts: 1180, badge: 'Knight' },
                                    { rank: 3, name: '高橋 健一', pts: 950, badge: 'Seeker' }
                                ].map((leader, i) => (
                                    <div key={i} className={`flex items-center gap-4 p-3 rounded-2xl transition-all ${leader.rank === 1 ? 'bg-terracotta/5 border border-terracotta/10' : ''}`}>
                                        <span className={`w-6 h-6 flex items-center justify-center text-[10px] font-black rounded-full ${leader.rank === 1 ? 'bg-terracotta text-white' : 'bg-taupe/5'}`}>
                                            {leader.rank}
                                        </span>
                                        <div className="flex-1">
                                            <div className="text-xs font-bold">{leader.name}</div>
                                            <div className="text-[9px] font-bold uppercase text-taupe-light/60 tracking-widest">{leader.badge}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-bold tracking-tighter">{leader.pts}.pt</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Network Canvas (Faded Background) */}
                            <div className="absolute bottom-0 left-0 right-0 h-[240px] opacity-40 rounded-b-[3rem] overflow-hidden">
                                <canvas ref={canvasRef} className="w-full h-full"></canvas>
                            </div>
                        </PremiumCard>
                    </div>
                </div>

            </main>
        </div>
    );
}
