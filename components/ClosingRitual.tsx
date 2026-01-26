'use client';

import React, { useState } from 'react';
import { ArrowRight, Moon, Sparkles, LogOut, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';

export default function ClosingRitual() {
    const { user } = useUser();
    const router = useRouter();
    const [step, setStep] = useState<'reflection' | 'owl_response' | 'stamp' | 'goodbye'>('reflection');
    const [reflection, setReflection] = useState('');
    const [owlResponse, setOwlResponse] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [showStamp, setShowStamp] = useState(false);
    const [earnedPoints, setEarnedPoints] = useState(false);
    const { updatePointsOptimistically } = useUser();

    const handleComplete = async () => {
        if (reflection.trim().length < 2 || reflection === 'あ') {
            // Speed mode: No points, no OWL response
            finish();
            return;
        }

        setEarnedPoints(true);

        // 1. OWL Response Phase
        setStep('owl_response');
        setIsThinking(true);

        await new Promise(r => setTimeout(r, 1500));

        const responses = [
            `今日もお疲れ様でした！「${reflection}」という気付き、とても大切ですね。${user.name}さんの丁寧な仕事が、組織の大きな支えになっています。`,
            `一日の締めくくりに素晴らしい振り返りです。${reflection}という想いを力に変えて、明日は今日よりさらに良い日になりますよ。`,
            `大変な一日だったかもしれませんが、${reflection}をやり遂げた自分を褒めてあげてください。ゆっくり休む資格、十分にあります！`
        ];
        setOwlResponse(responses[Math.floor(Math.random() * responses.length)]);
        setIsThinking(false);

        // Save reflection in background and award points
        try {
            updatePointsOptimistically(30);
            fetch('/api/points', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'awardPoints', targetUserIds: [user.id], points: 30, thanks: 0 })
            }).catch(console.error);

            // Legacy closing log (for backward compatibility)
            fetch('/api/closing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, reflection, timestamp: new Date().toISOString() })
            }).catch(console.error);

            // New: Save daily reflection with metrics snapshot for Closed Loop Ritual
            fetch('/api/rituals/closing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    reflectionText: reflection,
                    reflectionType: 'contribution',
                    metricsSnapshot: {
                        points: (user.points || 0) + 30, // Include the points just awarded
                        thanks: user.thanksCount || 0,
                        timeSaved: user.timeSaved || 0
                    }
                })
            }).catch(console.error);
        } catch (e) { console.error(e); }
    };

    const goToStamp = () => {
        setStep('stamp');
        setTimeout(() => setShowStamp(true), 100);

        // Wait for stamp animation then go to goodbye
        setTimeout(() => {
            setStep('goodbye');
            setTimeout(() => {
                finish();
            }, 3000);
        }, 2000);
    };

    const finish = () => {
        // Redirect to login or home (simulated logout)
        // For MVP, just go back to home or show a stored state?
        // User said "Logoff". Usually goes to Login.
        // But we don't have real auth pages visible in this MVP flow maybe?
        // Let's redirect to '/' with a query param or just reload to simulate reset.
        window.location.href = '/?ritual=reset'; // Loop back to start? Or just '/'
        // Actually, if we want to show Morning Ritual NEXT time, we shouldn't reset it now.
        // We should just clear session?
        // Let's just go to root.
        router.push('/');
    };

    if (step === 'owl_response') {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/95 font-sans">
                <div className="w-full max-w-2xl p-8 flex flex-col items-center">
                    <div className="mb-12 p-6 bg-white/10 rounded-full shadow-2xl border border-white/20 ring-1 ring-white/10 animate-pulse">
                        <img src="/Mr.OWL_Silhouette.png" className="w-16 h-16 object-contain" />
                    </div>

                    <div className="w-full animate-in fade-in zoom-in duration-500">
                        <div className="bg-indigo-600 text-white p-8 rounded-[2.5rem] rounded-tl-none shadow-premium relative">
                            <div className="absolute -left-4 top-0 w-8 h-8 bg-indigo-600 rotate-45" />
                            {isThinking ? (
                                <div className="flex gap-2 p-4 justify-center">
                                    <div className="w-3 h-3 bg-white/50 rounded-full animate-bounce" />
                                    <div className="w-3 h-3 bg-white/50 rounded-full animate-bounce [animation-delay:0.2s]" />
                                    <div className="w-3 h-3 bg-white/50 rounded-full animate-bounce [animation-delay:0.4s]" />
                                </div>
                            ) : (
                                <>
                                    <p className="text-xl font-medium leading-relaxed mb-6">{owlResponse}</p>
                                    <button
                                        onClick={goToStamp}
                                        className="mt-4 px-8 py-3 bg-white text-indigo-600 font-bold rounded-2xl hover:bg-slate-100 transition-all flex items-center gap-2 ml-auto"
                                    >
                                        終了を記録する <ArrowRight size={18} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'stamp') {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm text-white font-sans">
                <style jsx>{`
                    @keyframes stamp-bounce {
                        0% { transform: scale(3); opacity: 0; }
                        50% { transform: scale(0.9); opacity: 1; }
                        70% { transform: scale(1.1); }
                        100% { transform: scale(1) rotate(-15deg); }
                    }
                    .animate-stamp {
                        animation: stamp-bounce 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                    }
                `}</style>
                <div className="relative flex flex-col items-center">
                    <div className="bg-white text-slate-800 p-8 rounded-lg shadow-2xl max-w-md w-full border border-slate-200">
                        <p className="text-sm text-slate-400 mb-2 font-bold uppercase tracking-wider">活動レポート <span className="text-slate-200 mx-2">|</span> {new Date().toLocaleDateString('ja-JP')}</p>
                        <p className="text-2xl font-serif italic mb-12 text-center text-slate-700 leading-relaxed font-bold border-b border-slate-100 pb-8 min-h-[4rem]">
                            "{reflection}"
                        </p>

                        <div className="h-32 flex items-center justify-center relative">
                            {/* Points Visualization */}
                            {earnedPoints && (
                                <div className="absolute top-0 right-0 text-right animate-in fade-in slide-in-from-right duration-1000 delay-500">
                                    <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">獲得</span>
                                    <span className="text-2xl font-black text-amber-500">+30<span className="text-xs text-amber-300 ml-0.5">pt</span></span>
                                </div>
                            )}

                            {showStamp && (
                                <div className="absolute border-[6px] border-red-600 rounded-full w-32 h-32 flex items-center justify-center animate-stamp opacity-0">
                                    <div className="text-center">
                                        <div className="text-xs text-red-600 font-black border-b-2 border-red-600 mb-1 pb-0.5 mx-4 tracking-widest">OWLIGHT</div>
                                        <div className="text-4xl font-black text-red-600 tracking-[0.2em] py-1">承認</div>
                                        <div className="text-[10px] text-red-600 font-bold border-t-2 border-red-600 mt-1 pt-0.5 mx-4 tracking-widest">COMPLETE</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <p className="mt-8 text-white/50 animate-pulse text-xs tracking-[0.2em]">貢献を記録しています...</p>
                </div>
            </div>
        );
    }

    if (step === 'goodbye') {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900 text-white font-sans">
                <div className="text-center animate-in fade-in zoom-in duration-1000">
                    <Moon size={64} className="mx-auto mb-6 text-indigo-300 animate-pulse" />
                    <h2 className="text-5xl md:text-6xl font-thin tracking-tighter mb-4">It’s All Right.</h2>
                    <p className="text-indigo-200 text-md font-medium tracking-widest uppercase mb-2">お疲れ様でした</p>
                    <p className="text-indigo-200/50 text-xs">ゆっくりとお休みください。</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden font-sans antialiased bg-[#0F172A]">
            {/* Night Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A] to-[#1E293B]">
                <div className="absolute top-10 right-20 w-1 h-1 bg-white rounded-full animate-pulse"></div>
                <div className="absolute top-40 left-1/4 w-0.5 h-0.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute bottom-1/3 right-1/3 w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="relative z-10 w-full max-w-4xl p-8 animate-in fade-in slide-in-from-bottom-8 duration-700 flex flex-col items-center">

                <div className="mb-8 p-6 bg-white/5 rounded-full shadow-2xl border border-white/10 ring-1 ring-indigo-500/20">
                    <Moon size={40} className="text-indigo-300" />
                </div>

                <h2 className="text-4xl md:text-5xl font-thin tracking-tight text-white mb-2 text-center">
                    一日の締めくくり
                </h2>
                <p className="text-indigo-200/60 text-sm font-medium tracking-widest uppercase mb-12">
                    Daily Closing
                </p>

                <div className="w-full max-w-2xl mx-auto space-y-8">
                    <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10 shadow-xl">
                        <label className="block text-indigo-200/80 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Sparkles size={14} />
                            今日のハイライトと感想
                        </label>
                        <textarea
                            value={reflection}
                            onChange={(e) => setReflection(e.target.value)}
                            placeholder="今日はどんな一日でしたか？成果や気付き、明日へのメモを残しましょう..."
                            className="w-full h-32 bg-transparent border-0 focus:ring-0 text-lg text-white placeholder:text-indigo-200/20 resize-none leading-relaxed"
                            autoFocus
                        />
                    </div>

                    <div className="flex flex-col gap-4">
                        <button
                            onClick={handleComplete}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-900/20 transition-all active:scale-95 flex items-center justify-center gap-3"
                        >
                            <LogOut size={18} />
                            <span>業務を終了する</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
