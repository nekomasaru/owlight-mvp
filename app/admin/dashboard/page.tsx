'use client';

import React, { useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import {
    Home,
    Moon,
    Sun,
    AlertTriangle,
    TrendingUp,
    Users,
    BookOpen,
    Brain,
    Leaf
} from 'lucide-react';
import ForestVitality from '@/components/Admin/ForestVitality';

const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`bg-card rounded-xl shadow-sm p-6 ${className}`}>
        {children}
    </div>
);

export default function AdminDashboardPage() {
    const { user } = useUser();
    const [isSimulating, setIsSimulating] = useState(true);

    return (
        <div className="min-h-screen bg-background font-sans text-foreground">
            {/* Header */}
            {/* Header Removed as per user request (overlapping) */}

            <main className="max-w-7xl mx-auto px-8 py-8 space-y-12">

                {/* 1. Forest Vitality Hero Section */}
                <ForestVitality />

                {/* Simulation Control (Moved from header) */}
                <div className="flex justify-end items-center gap-3">
                    <span className="text-xs font-bold text-slate-400">ナレッジ継承シミュレーション</span>
                    <div
                        className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${isSimulating ? 'bg-terracotta' : 'bg-slate-300'}`}
                        onClick={() => setIsSimulating(!isSimulating)}
                    >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform ${isSimulating ? 'translate-x-6' : 'translate-x-0'}`} />
                    </div>
                </div>

                {/* 2. Org Tree Visualization (Simplified) */}
                <div className="flex flex-col items-center gap-8 relative pb-12">
                    {/* Root */}
                    <div className="px-8 py-3 bg-terracotta/10 border border-terracotta/30 text-terracotta font-bold rounded-lg">
                        市民生活部
                    </div>

                    {/* Lines */}
                    <div className="w-1/2 h-8 border-t border-l border-r border-slate-300 rounded-t-xl" />

                    {/* Children */}
                    <div className="flex gap-8 w-full justify-center">
                        <Card className="w-64 text-center border-b-4 border-b-sage">
                            <div className="font-bold mb-2">市民課</div>
                            <div className="flex justify-center gap-1">
                                <div className="w-3 h-3 rounded-full bg-sage" />
                                <div className="w-3 h-3 rounded-full bg-sage" />
                            </div>
                        </Card>

                        <Card className={`w-64 text-center border-b-4 ${isSimulating ? 'border-b-red-400 bg-red-50' : 'border-b-sage'}`}>
                            <div className="font-bold mb-2">保険年金課</div>
                            {isSimulating ? (
                                <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-1 rounded">SOS過多</span>
                            ) : (
                                <div className="flex justify-center gap-1">
                                    <div className="w-3 h-3 rounded-full bg-sage" />
                                </div>
                            )}
                        </Card>

                        <Card className="w-64 text-center border-b-4 border-b-sage">
                            <div className="font-bold mb-2">環境政策課</div>
                            <div className="flex justify-center gap-1">
                                <div className="w-3 h-3 rounded-full bg-sage" />
                                <div className="w-3 h-3 rounded-full bg-sage" />
                            </div>
                        </Card>
                    </div>

                    {/* Simulation Popover */}
                    {isSimulating && (
                        <div className="absolute top-[60%] animate-in fade-in slide-in-from-bottom-2">
                            <div className="bg-slate-100 text-slate-500 text-[10px] font-bold px-3 py-1 rounded border border-slate-200">
                                👤 佐藤係長 (Key) ➡ 異動
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. Risk Alert (Black Box) */}
                <div className="relative group perspective-1000">
                    <div className="absolute -inset-1 bg-red-500/20 blur-xl opacity-75 animate-pulse rounded-2xl" />
                    <div className="relative bg-[#2A2A2A] text-white p-8 rounded-xl border-t-4 border-red-500 shadow-2xl overflow-hidden">

                        {/* Warning Header */}
                        <div className="flex flex-col items-center justify-center mb-8 text-center">
                            <AlertTriangle size={40} className="text-amber-400 mb-4 animate-bounce" />
                            <h3 className="text-xl font-bold tracking-widest text-white mb-2">業務継続リスク警告</h3>
                            <p className="text-sm text-slate-300">
                                佐藤係長の異動により、業務遂行品質の維持が困難になる可能性があります。<br />
                                業務継続リスク: <span className="text-red-400 font-bold">85% (要・高度人材補充)</span>
                            </p>
                        </div>

                        {/* AI Recommendation */}
                        <div className="bg-white/5 border border-white/10 rounded-lg p-6 flex flex-col md:flex-row items-center gap-6">
                            <div className="text-xs font-bold text-lime-400 uppercase tracking-widest whitespace-nowrap">
                                AI推奨: 最適な後任候補
                            </div>

                            <div className="flex-1 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">👤</div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-lg">斉藤 係長 (現: 財政課)</span>
                                        <span className="px-2 py-0.5 bg-lime-400/20 text-lime-400 text-[10px] font-bold rounded">マッチ度 94%</span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">
                                        同等のナレッジを有しており、田中課長との過去のプロジェクト協働実績から、
                                        <span className="text-lime-300 font-bold border-b border-lime-300 border-dashed mx-1">高い相乗効果（シナジー）</span>
                                        が予測されます。
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Side Danger Strip */}
                        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-b from-red-500/10 to-transparent border-l border-red-500/20 flex flex-col items-center justify-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-red-500" />
                            <div className="w-1 h-1 rounded-full bg-red-500" />
                            <div className="w-1 h-32 rounded-full bg-red-500/50" />
                            <div className="w-1 h-1 rounded-full bg-red-500" />
                        </div>
                    </div>
                </div>

                {/* 4. Good Job & Wisdom Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Good Job (Pride) */}
                    <Card>
                        <div className="flex justify-between items-center mb-6 border-l-4 border-sage pl-3">
                            <h3 className="text-sm font-bold text-slate-600">今月の Good Job (Pride)</h3>
                            <span className="text-[10px] text-slate-400">貢献度</span>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-sage/10 p-4 rounded-lg flex justify-between items-center">
                                <div className="flex items-start gap-3">
                                    <span className="text-xl">🌟</span>
                                    <div>
                                        <div className="text-xs font-bold text-slate-700">市民課: 山田主査のナレッジにより</div>
                                        <div className="text-xs text-slate-500">他課の契約ミスが <span className="font-bold underline">3件</span> 防がれました。</div>
                                    </div>
                                </div>
                                <span className="text-sm font-bold text-sage">+150pt</span>
                            </div>
                            <div className="bg-sage/10 p-4 rounded-lg flex justify-between items-center">
                                <div className="flex items-start gap-3">
                                    <span className="text-xl">🌱</span>
                                    <div>
                                        <div className="text-xs font-bold text-slate-700">税務課: 新人チームが</div>
                                        <div className="text-xs text-slate-500">マニュアル不備を <span className="font-bold underline">5箇所</span> 指摘しました。</div>
                                    </div>
                                </div>
                                <span className="text-sm font-bold text-sage">+80pt</span>
                            </div>
                        </div>
                    </Card>

                    {/* Wisdom Accumulation */}
                    <Card>
                        <div className="flex justify-between items-center mb-6 border-l-4 border-sage pl-3">
                            <h3 className="text-sm font-bold text-slate-600">蓄積された「英知(Wisdom)」</h3>
                        </div>
                        <div className="flex flex-col items-center justify-center h-48">
                            <div className="text-5xl font-bold text-sage mb-2 tracking-tighter">
                                1,248 <span className="text-lg font-normal text-slate-400">件の判断ロジック</span>
                            </div>
                            <p className="text-xs text-slate-400 text-center mt-4">
                                解析・蓄積された<br />
                                「なぜそう判断したか」のログ
                            </p>
                        </div>
                    </Card>
                </div>

            </main>
        </div>
    );
}
