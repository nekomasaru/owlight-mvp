'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import {
    ArrowLeft,
    User as UserIcon,
    Award,
    Heart,
    TrendingUp,
    Zap,
    Info
} from 'lucide-react';

// --- Simple Components (Consistent with Chat/Admin/Search Pages) ---

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

export default function EngagementPage() {
    const [points, setPoints] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const user = { name: 'Taro' };

    useEffect(() => {
        const userDocRef = doc(db, 'users', 'taro');
        const unsubscribe = onSnapshot(userDocRef, async (docSnapshot) => {
            if (docSnapshot.exists()) {
                const data = docSnapshot.data();
                setPoints(data.points);
                setIsLoading(false);
            } else {
                try {
                    await setDoc(userDocRef, { name: user.name, points: 10 });
                } catch (error) {
                    console.error(error);
                    setIsLoading(false);
                }
            }
        }, (error) => {
            console.error(error);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleThanks = async () => {
        if (points === null) return;
        try {
            const userDocRef = doc(db, 'users', 'taro');
            await updateDoc(userDocRef, { points: points + 1 });
        } catch (error) {
            console.error(error);
        }
    };

    const getLevelInfo = (pts: number) => {
        if (pts < 20) return { label: 'Seedling', color: 'text-slate-400', bg: 'bg-slate-200/20' };
        if (pts < 50) return { label: 'Baby Owl', color: 'text-sage', bg: 'bg-sage/10' };
        return { label: 'Wisdom Owl', color: 'text-terracotta', bg: 'bg-terracotta/10' };
    };

    const level = points !== null ? getLevelInfo(points) : { label: 'Loading...', color: 'text-slate-300', bg: 'bg-slate-50' };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">

            {/* Header */}
            <header className="sticky top-0 z-10 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 h-14 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full border border-terracotta overflow-hidden shadow-sm">
                        <img src="/Mr.OWL.jpg" alt="Logo" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="font-bold text-taupe text-lg tracking-tight">OWLight</span>
                        <span className="text-taupe-light text-[10px] font-bold uppercase tracking-wider border border-slate-200 rounded px-1.5 py-0.5">プロフィール</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/">
                        <Button variant="ghost" className="h-8 text-xs font-semibold">
                            <ArrowLeft size={14} className="mr-2" />
                            チャットに戻る
                        </Button>
                    </Link>
                </div>
            </header>

            <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-12 flex flex-col gap-10">

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Left Column: Avatar & Basic Info */}
                    <div className="md:col-span-1 space-y-6">
                        <Card className="p-8 flex flex-col items-center text-center">
                            <div className="relative mb-6">
                                <div className="h-24 w-24 rounded-full border-4 border-white shadow-xl overflow-hidden ring-4 ring-slate-50">
                                    <div className="h-full w-full bg-slate-100 flex items-center justify-center text-slate-400">
                                        <UserIcon size={40} strokeWidth={1.5} />
                                    </div>
                                </div>
                                <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-white rounded-full border border-slate-100 shadow-md flex items-center justify-center text-amber-500">
                                    <Award size={20} />
                                </div>
                            </div>

                            <h2 className="text-xl font-bold text-taupe mb-1">{user.name}</h2>
                            <p className="text-taupe-light text-xs font-bold uppercase tracking-widest mb-4">総務部 / 管理課</p>

                            <div className={`px-4 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${level.bg} ${level.color} border border-current/10`}>
                                {level.label}
                            </div>
                        </Card>

                        <Card className="p-6">
                            <h3 className="text-xs font-bold text-taupe uppercase tracking-wider mb-4 flex items-center">
                                <Info size={14} className="mr-2 text-slate-400" />
                                成長ステータス
                            </h3>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold text-taupe-light uppercase tracking-tighter">
                                        <span>進化の過程</span>
                                        <span>{points || 0} / 50 PT</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-terracotta transition-all duration-1000"
                                            style={{ width: `${Math.min(((points || 0) / 50) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <p className="text-[10px] text-taupe-light leading-relaxed italic">
                                    "ドキュメントの登録やチャットでの活動を続けて、フクロウを進化させましょう。"
                                </p>
                            </div>
                        </Card>
                    </div>

                    {/* Right Column: Stats & Actions */}
                    <div className="md:col-span-2 space-y-8">
                        <div>
                            <h1 className="text-3xl font-extrabold text-taupe tracking-tight mb-2 font-display">エンゲージメント</h1>
                            <p className="text-taupe-light text-sm font-medium">組織のナレッジ蓄積への貢献度と成長記録。</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Card className="p-6 border-sage/20 bg-sage/5">
                                <div className="flex justify-between items-start mb-2 text-sage">
                                    <TrendingUp size={20} />
                                    <span className="text-[10px] font-bold tracking-widest uppercase">先週比 +12%</span>
                                </div>
                                <p className="text-xs font-bold text-sage-light uppercase tracking-widest mb-1">ナレッジポイント</p>
                                <p className="text-4xl font-black text-sage tracking-tighter">
                                    {isLoading ? '...' : points}
                                </p>
                            </Card>

                            <Card className="p-6">
                                <div className="flex justify-between items-start mb-2 text-terracotta">
                                    <Zap size={20} />
                                </div>
                                <p className="text-xs font-bold text-taupe-light uppercase tracking-widest mb-1">今週のランク</p>
                                <p className="text-4xl font-black text-taupe tracking-tighter">#04</p>
                            </Card>
                        </div>

                        <Card className="p-8">
                            <div className="flex flex-col items-center gap-6">
                                <div className="p-4 bg-terracotta/10 rounded-full text-terracotta">
                                    <Heart size={32} />
                                </div>
                                <div className="text-center max-w-xs">
                                    <h3 className="font-bold text-lg text-taupe mb-2">感謝のサイクル</h3>
                                    <p className="text-sm text-taupe-light leading-relaxed">
                                        コミュニティやAIのサポートに感謝を伝えましょう。
                                    </p>
                                </div>
                                <Button
                                    className="px-8 font-bold"
                                    onClick={handleThanks}
                                    disabled={isLoading}
                                >
                                    <Heart size={16} className="mr-2 fill-current" />
                                    感謝を送る
                                </Button>
                                <p className="text-[10px] text-slate-300 font-medium">
                                    Firebase Realtime Supportと連携中
                                </p>
                            </div>
                        </Card>
                    </div>

                </div>
            </main>

        </div>
    );
}
