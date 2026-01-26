'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, Sun, Sparkles, Star, Clock, Heart } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';

interface DailyGains {
    points: number;
    thanks: number;
    timeSaved: number;
}

export default function MorningRitual() {
    const { user, updatePointsOptimistically } = useUser();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isVisible, setIsVisible] = useState(false);
    const [lastReflection, setLastReflection] = useState<string | null>(null);
    const [dailyGains, setDailyGains] = useState<DailyGains | null>(null);
    const [todayIntent, setTodayIntent] = useState('');

    // Animation State
    const [animationStage, setAnimationStage] = useState<'falling' | 'landed' | 'absorbing' | 'growing'>('falling');
    const [leaves, setLeaves] = useState<{ id: string; type: 'points' | 'thanks' | 'time'; delay: number; x: number; rotation: number }[]>([]);

    useEffect(() => {
        const lastRitual = localStorage.getItem('lastMorningRitual');
        const today = new Date().toDateString();
        const ritualParam = searchParams.get('ritual');

        if (ritualParam === 'reset') {
            localStorage.removeItem('lastMorningRitual');
            setIsVisible(true);
        }

        if (lastRitual !== today || ritualParam === 'reset') {
            setIsVisible(true);
            if (user?.id) {
                console.log('[MorningRitual] Fetching daily report for user:', user.id);
                // Fetch from the new daily-report API
                fetch(`/api/rituals/morning/daily-report?userId=${user.id}`)
                    .then(res => res.json())
                    .then(data => {
                        console.log('[MorningRitual] API Response:', data);
                        if (data.hasReflection) {
                            setLastReflection(data.reflection?.text || null);
                            setDailyGains(data.gains || null);
                            console.log('[MorningRitual] Set gains:', data.gains);
                        } else {
                            console.log('[MorningRitual] No reflection found in response');
                        }
                    })
                    .catch(err => console.error('[MorningRitual] API Error:', err));
            } else {
                console.log('[MorningRitual] No user.id available yet');
            }
        }
    }, [user?.id, searchParams]);

    const [isResponding, setIsResponding] = useState(false);
    const [owlResponse, setOwlResponse] = useState('');

    const completeRitual = async () => {
        if (todayIntent.trim().length < 2 || todayIntent === 'あ') {
            // Speed mode/Skip: No points, no OWL response
            finish();
            return;
        }

        setIsResponding(true);
        // Simulate thinking
        await new Promise(r => setTimeout(r, 1000));

        const responses = [
            `「${todayIntent}」ですね。素晴らしい目標です！今日という日が${user.name}さんにとって実り多きものになるよう、私も全力でサポートしますね。`,
            `その意気です！「${todayIntent}」を意識することで、きっと良いリズムが生まれるはずです。応援しています。`,
            `なるほど、今日は「${todayIntent}」にフォーカスするのですね。${user.name}さんなら、きっとやり遂げられると信じています！`
        ];
        setOwlResponse(responses[Math.floor(Math.random() * responses.length)]);

        // Award points in background
        if (user?.id) {
            updatePointsOptimistically(10);
            fetch('/api/points', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'awardPoints', targetUserIds: [user.id], points: 10, thanks: 0 })
            }).catch(console.error);
        }

        const today = new Date().toDateString();
        localStorage.setItem('lastMorningRitual', today);
        localStorage.setItem('morningIntent', todayIntent);

        // Auto-close after 4 seconds or user clicks
        setTimeout(() => {
            finish();
        }, 4500);
    };

    const finish = () => {
        // Mark as completed for today
        const today = new Date().toDateString();
        localStorage.setItem('lastMorningRitual', today);

        setIsVisible(false);
        router.push('/');
    };

    // Dynamic Greeting Logic
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 5) return "静かな夜ですね。";
        if (hour < 10) return "おはようございます。";
        if (hour < 18) return "こんにちは。";
        return "こんばんは。";
    };

    useEffect(() => {
        if (isVisible && dailyGains) {
            // Generate leaves based on gains
            const newLeaves = [];
            // Points -> Gold Leaves (1 per 10 points, max 5)
            const pointLeaves = Math.min(5, Math.floor(dailyGains.points / 10));
            for (let i = 0; i < pointLeaves; i++) newLeaves.push({ id: `p-${i}`, type: 'points' as const, delay: i * 0.2, x: 20 + Math.random() * 60, rotation: Math.random() * 360 });

            // Thanks -> Pink Leaves (1 per 1 thank, max 5)
            const thanksLeaves = Math.min(5, dailyGains.thanks);
            for (let i = 0; i < thanksLeaves; i++) newLeaves.push({ id: `t-${i}`, type: 'thanks' as const, delay: 1 + i * 0.3, x: 20 + Math.random() * 60, rotation: Math.random() * 360 });

            // Time -> Blue Leaves (1 per 10 mins, max 3)
            const timeLeaves = Math.min(3, Math.floor(dailyGains.timeSaved / 10));
            for (let i = 0; i < timeLeaves; i++) newLeaves.push({ id: `tm-${i}`, type: 'time' as const, delay: 2 + i * 0.4, x: 20 + Math.random() * 60, rotation: Math.random() * 360 });

            if (newLeaves.length > 0) {
                setLeaves(newLeaves);
                // Transition to 'landed' after falling animation (approx 4s)
                setTimeout(() => setAnimationStage('landed'), 4500);
            } else {
                setAnimationStage('landed'); // Skip if no gains
            }
        }
    }, [isVisible, dailyGains]);

    const handleIntentFocus = () => {
        if (animationStage === 'landed' && leaves.length > 0) {
            setAnimationStage('absorbing');
            // After absorption (1s), change to growing
            setTimeout(() => setAnimationStage('growing'), 1000);
        }
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[100] overflow-hidden font-sans antialiased bg-[#F0F4F8]">
            {/* Styles for Animations */}
            <style jsx>{`
                @keyframes fall {
                    0% { transform: translateY(-10vh) rotate(0deg); opacity: 0; }
                    10% { opacity: 1; }
                    100% { transform: translateY(60vh) rotate(360deg); opacity: 1; }
                }
                @keyframes absorb {
                    0% { transform: translateY(0) scale(1); opacity: 1; }
                    100% { transform: translateY(20vh) scale(0); opacity: 0; }
                }
                .leaf {
                    position: absolute;
                    top: 10vh;
                    font-size: 24px;
                    filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
                    transition: all 1s ease-in-out;
                }
                .leaf.falling {
                    animation: fall 3s ease-out forwards;
                }
                .leaf.landed {
                    top: auto;
                    bottom: 35%; /* Adjust based on where Summary Card is */
                    transition: top 3s ease;
                }
                .leaf.absorbing {
                    top: auto;
                    bottom: 30%;
                    animation: absorb 0.8s ease-in forwards;
                }
            `}</style>

            {/* Ambient Background */}
            <div className={`fixed inset-0 bg-gradient-to-br from-amber-50/50 to-blue-50/50 transition-colors duration-[3000ms] ${animationStage === 'growing' ? 'from-green-50/50 to-emerald-50/50' : ''}`} />

            {/* Falling Leaves Layer */}
            {leaves.map((leaf) => (
                <div
                    key={leaf.id}
                    className={`leaf ${animationStage}`}
                    style={{
                        left: `${leaf.x}%`,
                        animationDelay: `${leaf.delay}s`,
                        color: leaf.type === 'points' ? '#fbbf24' : leaf.type === 'thanks' ? '#fb7185' : '#60a5fa',
                        zIndex: 20
                    }}
                >
                    {leaf.type === 'points' ? <Star fill="currentColor" /> : leaf.type === 'thanks' ? <Heart fill="currentColor" /> : <Clock />}
                </div>
            ))}

            <div className="relative z-10 w-full min-h-full flex flex-col items-center justify-center p-6 md:p-12">

                {/* Hero Icon */}
                <div className="mb-8 relative group cursor-default">
                    {/* ... (Hero Icon logic unchanged) ... */}
                    <div className="absolute inset-0 bg-amber-200/50 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-1000 opacity-50" />
                    <div className="relative p-6 bg-white/60 backdrop-blur-xl rounded-full shadow-2xl border border-white/80 ring-1 ring-white/50 animate-[bounce_3s_infinite]">
                        <Sun size={48} className="text-amber-500 drop-shadow-lg" />
                    </div>
                </div>

                {/* Typography */}
                <h2 className="text-5xl md:text-7xl font-thin tracking-tighter text-slate-700 drop-shadow-sm mb-3 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    {getGreeting()}
                </h2>
                <p className="text-slate-500 font-medium tracking-widest uppercase mb-10 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
                    {new Date().toLocaleDateString('ja-JP', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>

                {/* Yesterday's Review Section (Closed Loop) */}
                <div className={`w-full max-w-2xl mx-auto mb-10 transition-all duration-1000 ${animationStage === 'absorbing' || animationStage === 'growing' ? 'opacity-50 scale-95 blur-[2px]' : ''}`}>
                    {(lastReflection || dailyGains) ? (
                        <div className="bg-white/40 backdrop-blur-md p-6 md:p-8 rounded-[2rem] border border-white/60 shadow-xl w-full relative overflow-hidden group hover:bg-white/50 transition-all">
                            {/* ... (Metrics Display Logic) ... */}
                            {/* Metrics Display */}
                            {dailyGains && (dailyGains.points > 0 || dailyGains.thanks > 0) && (
                                <div className="flex justify-center gap-6 mb-4">
                                    {dailyGains.points > 0 && (
                                        <div className="flex items-center gap-2 bg-amber-100/50 px-4 py-2 rounded-full">
                                            <Star size={16} className="text-amber-500" />
                                            <span className="text-amber-700 font-bold">+{dailyGains.points} pt</span>
                                        </div>
                                    )}
                                    {dailyGains.thanks > 0 && (
                                        <div className="flex items-center gap-2 bg-rose-100/50 px-4 py-2 rounded-full">
                                            <Heart size={16} className="text-rose-500" />
                                            <span className="text-rose-700 font-bold">+{dailyGains.thanks} ありがとう</span>
                                        </div>
                                    )}
                                    {/* ... Time ... */}
                                    {dailyGains.timeSaved > 0 && (
                                        <div className="flex items-center gap-2 bg-blue-100/50 px-4 py-2 rounded-full">
                                            <Clock size={16} className="text-blue-500" />
                                            <span className="text-blue-700 font-bold">+{dailyGains.timeSaved} 分</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Reflection Text */}
                            {lastReflection && (
                                <p className="text-xl md:text-2xl font-medium text-slate-700 italic leading-relaxed font-serif text-center">"{lastReflection}"</p>
                            )}
                        </div>
                    ) : (
                        <p className="text-xl font-light text-slate-400 text-center">新しい1日の始まりです。</p>
                    )}
                </div>

                {/* Input / Response Area */}
                <div className="w-full max-w-md mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-700 relative z-30">
                    {/* Magical Glow Effect when Growing */}
                    {animationStage === 'growing' && (
                        <div className="absolute inset-0 bg-amber-200/30 blur-3xl animate-pulse rounded-full pointer-events-none" />
                    )}

                    {!isResponding ? (
                        <>
                            <div className="relative group">
                                <input
                                    type="text"
                                    value={todayIntent}
                                    onChange={(e) => setTodayIntent(e.target.value)}
                                    onFocus={handleIntentFocus}
                                    placeholder="今日の抱負は何ですか？"
                                    className={`w-full py-4 px-8 bg-white/60 border-2 border-white/50 rounded-2xl text-center text-lg md:text-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white transition-all shadow-lg text-shadow-sm ${animationStage === 'growing' ? 'border-terracotta/50 ring-4 ring-terracotta/20 shadow-terracotta/30' : 'focus:border-terracotta/30 focus:ring-4 focus:ring-terracotta/10'}`}
                                    onKeyDown={(e) => e.key === 'Enter' && completeRitual()}
                                    autoFocus
                                />
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={completeRitual}
                                    className="w-full py-4 bg-slate-800 text-white font-bold rounded-xl shadow-xl hover:bg-slate-700 hover:shadow-2xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 text-sm tracking-widest uppercase group"
                                >
                                    活動を開始する <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                                <button
                                    onClick={finish}
                                    className="py-2 text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors mb-4"
                                >
                                    スキップ
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="animate-in fade-in zoom-in duration-500">
                            {/* ... (Response UI unchanged) ... */}
                            <div className="bg-slate-800 text-white p-6 rounded-[2rem] rounded-tl-none shadow-2xl relative">
                                <div className="absolute -left-3 top-0 w-6 h-6 bg-slate-800 rotate-45" />
                                {owlResponse ? (
                                    <p className="text-md font-medium leading-relaxed">{owlResponse}</p>
                                ) : (
                                    <div className="flex gap-2 p-2">
                                        <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" />
                                        <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                                        <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={finish}
                                className="mt-8 mx-auto flex items-center gap-2 text-slate-400 hover:text-slate-600 text-[10px] font-bold uppercase tracking-widest transition-all"
                            >
                                クリックして進む <ArrowRight size={12} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
// Using tailwind standard classes.
