'use client';

import React, { useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { ShieldCheck, Calendar, Briefcase, Award, ArrowRight, ToggleLeft, ToggleRight, Settings } from 'lucide-react';

const PremiumCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`bg-white rounded-3xl shadow-premium border border-white/50 p-8 ${className}`}>
        {children}
    </div>
);

export default function ProfilePage() {
    const { user } = useUser();

    // Mock History Data
    const transferHistory = [
        {
            period: "令和5年4月1日 〜 現在",
            department: "市民生活部 市民課",
            duties: ["マイナンバーカード交付", "住民票発行・管理"],
            isCurrent: true,
            color: "border-terracotta"
        },
        {
            period: "令和2年4月1日 〜 令和5年3月31日",
            department: "北区役所 福祉課",
            duties: ["児童手当", "児童扶養手当"],
            isCurrent: false,
            color: "border-slate-300"
        },
        {
            period: "平成29年4月1日 〜 令和2年3月31日",
            department: "環境局 環境施策課",
            duties: ["ごみ減量推進", "リサイクル啓発"],
            isCurrent: false,
            color: "border-slate-300"
        }
    ];

    const contributions = [
        {
            date: "2025.04 - 2025.10",
            title: "保険年金課の繁忙期支援",
            desc: "越境しての窓口対応支援回数: 24回。特に外国人住民への丁寧な説明に対して多数の感謝ポイントを獲得。",
            tags: ["人事考課へ反映", "キャリアデザインへ反映"],
            active: true
        },
        {
            date: "2024.10",
            title: "マニュアル行間補完",
            desc: "「児童手当特例給付」に関するマニュアル不備を5箇所指摘・修正。AI回答精度の向上に貢献。",
            tags: ["人事考課へ反映", "キャリアデザインへ反映"],
            active: false
        },
        {
            date: "2024.08",
            title: "新人職員OJT担当",
            desc: "新人3名のメンターを担当。マニュアル作成指導により独り立ち期間を1ヶ月短縮。",
            tags: [],
            active: true
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50 font-sans p-8 pb-20">
            <div className="max-w-7xl mx-auto space-y-8">
                <header className="mb-8">
                    <h1 className="text-2xl font-bold text-taupe">プロファイル</h1>
                </header>

                {/* Top Profile Card */}
                <PremiumCard className="flex flex-col md:flex-row items-center gap-8">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full bg-blue-500 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                            {user.name.charAt(0)}
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full border-2 border-white shadow-sm">
                            LV.42
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left space-y-2">
                        <h2 className="text-3xl font-bold text-taupe">{user.name}</h2>
                        <p className="text-taupe-light font-medium">{user.department}</p>
                        <div className="flex flex-wrap gap-2 justify-center md:justify-start mt-2">
                            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded border border-yellow-200">Tier 2認定候補</span>
                            <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded border border-slate-200">担当事務: 住民票発行・管理</span>
                        </div>
                    </div>

                    <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 min-w-[200px] text-center">
                        <div className="text-xs text-taupe-light mb-1">獲得した知恵ポイント</div>
                        <div className="text-4xl font-thin tracking-tighter text-terracotta mb-2">1,250 <span className="text-sm">pt</span></div>
                        <button className="text-[10px] bg-white border border-slate-200 px-3 py-1 rounded shadow-sm text-slate-400 cursor-not-allowed">交換 (Coming Soon)</button>
                    </div>
                </PremiumCard>

                {/* Settings Toggles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <PremiumCard className="flex items-start gap-4 p-6">
                        <div className="flex-1">
                            <h3 className="font-bold text-taupe text-sm mb-1">キャリア関心の共有</h3>
                            <p className="text-xs text-taupe-light">あなたが興味を持っている分野を人事へ通知します</p>
                        </div>
                        <Switch />
                    </PremiumCard>
                    <PremiumCard className="flex items-start gap-4 p-6">
                        <div className="flex-1">
                            <h3 className="font-bold text-taupe text-sm mb-1">メンタルヘルス予兆共有</h3>
                            <p className="text-xs text-taupe-light">過度なストレス兆候を産業医に匿名連携します</p>
                        </div>
                        <Switch />
                    </PremiumCard>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Left: Transfer & Duty History (Timeline) */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-taupe text-lg flex items-center gap-2">
                            <Briefcase size={20} /> 人事異動・事務分担歴
                        </h3>
                        <div className="relative pl-4 pb-4">
                            {/* Vertical Line - Continuous */}
                            <div className="absolute top-4 bottom-0 left-[19px] w-0.5 bg-slate-200" style={{ zIndex: 0 }} />

                            {transferHistory.map((item, idx) => (
                                <div key={idx} className="relative pl-8 mb-8 last:mb-0">
                                    {/* Dot with Connector effect */}
                                    <div className={`absolute top-0 left-0 w-10 h-10 -ml-[0.5px] rounded-full border-4 bg-white flex items-center justify-center shadow-sm z-10 transition-all ${item.isCurrent ? 'border-terracotta scale-110' : 'border-slate-300'}`}>
                                        <div className={`w-3 h-3 rounded-full ${item.isCurrent ? 'bg-terracotta' : 'bg-slate-300'}`} />
                                    </div>

                                    {/* Additional date label above card for timeline flow */}
                                    <div className="text-[10px] font-bold text-slate-400 mb-1 ml-1">{item.period.split('〜')[0].trim()}</div>

                                    <PremiumCard className={`p-6 hover:shadow-lg transition-all relative ${item.isCurrent ? 'ring-2 ring-terracotta/20' : 'opacity-90 grayscale-[0.1] hover:grayscale-0'}`}>
                                        <div className="absolute -left-2 top-5 w-4 h-0.5 bg-slate-200 -z-10 hidden" /> {/* Optional horizontal connector */}

                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                                            <h4 className="text-lg font-bold text-taupe">{item.department}</h4>
                                            <span className="text-[10px] font-bold text-taupe-light bg-slate-50 px-2 py-1 rounded inline-block mt-1 sm:mt-0">{item.period}</span>
                                        </div>

                                        <div className="flex flex-wrap gap-2 mt-4">
                                            {item.duties.map((duty, dIdx) => (
                                                <span key={dIdx} className="text-xs font-medium bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200">
                                                    {duty}
                                                </span>
                                            ))}
                                        </div>
                                    </PremiumCard>
                                </div>
                            ))}

                            {/* Start Point */}
                            <div className="relative pl-8 pt-4">
                                <div className="absolute top-2 left-0 w-10 h-10 -ml-[0.5px] rounded-full border-4 border-slate-200 bg-white flex items-center justify-center shadow-sm z-10">
                                    <div className="w-2 h-2 rounded-full bg-slate-300" />
                                </div>
                                <div className="pl-2 pt-2">
                                    <div className="text-xs font-bold text-slate-400">大阪市役所 新規採用</div>
                                    <div className="text-[10px] text-slate-300">平成25年4月1日</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Contribution History */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-taupe text-lg flex items-center gap-2">
                            <Award size={20} /> 組織への貢献履歴
                        </h3>
                        <div className="space-y-6 h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                            {contributions.map((con, idx) => (
                                <PremiumCard key={idx} className="p-6 relative group hover:border-terracotta/30 transition-all">
                                    <div className="text-[10px] font-bold text-terracotta/80 mb-2">{con.date}</div>
                                    <h4 className="text-md font-bold text-taupe mb-2">{con.title}</h4>
                                    <p className="text-xs text-taupe-light leading-relaxed mb-4">{con.desc}</p>

                                    <div className="border-t border-slate-100 pt-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-slate-400">人事考課へ反映</span>
                                            <Switch checked={con.active} />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-slate-400">キャリアデザインへ反映</span>
                                            <Switch checked={con.active} />
                                        </div>
                                    </div>
                                </PremiumCard>
                            ))}
                            {/* Scroll Indicator at bottom if needed */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Simple Switch Component
const Switch = ({ checked = false }: { checked?: boolean }) => (
    <div className={`w-10 h-6 rounded-full p-1 transition-colors cursor-pointer ${checked ? 'bg-terracotta' : 'bg-slate-200'}`}>
        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </div>
);
