'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, Sparkles } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useUser } from '@/contexts/UserContext'; // Added

export default function ClosingPage() {
    const { user } = useUser(); // Use Context
    const [step, setStep] = useState<'init' | 'question' | 'input' | 'containment' | 'final'>('init');
    const [wisdom, setWisdom] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setStep('question');
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    const handleResponse = (type: 'yes' | 'little' | 'no') => {
        if (type === 'no') {
            setStep('containment');
            setTimeout(() => setStep('final'), 4000);
        } else {
            setStep('input');
        }
    };

    const submitWisdom = async () => {
        if (!wisdom.trim()) return;
        setIsSaving(true);
        try {
            await addDoc(collection(db, 'wisdoms'), {
                content: wisdom,
                createdAt: serverTimestamp(),
                author: user.name, // Dynamic name
                type: 'daily_reflection'
            });
            setTimeout(() => setStep('final'), 1200);
        } catch (error) {
            console.error(error);
            setStep('final');
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center font-sans antialiased overflow-hidden relative text-white">

            {/* Background: Sophisticated Twilight Animation */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#1A1A2E] via-[#2A1F3D] to-[#4A2C2C] animate-[pulse_15s_infinite_alternate]"
                style={{ backgroundSize: '100% 150%' }}>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none"></div>
            </div>

            {/* Glass Card */}
            <div className={`relative z-10 w-full max-w-xl p-12 bg-white/5 backdrop-blur-[40px] rounded-[3rem] border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] transition-all duration-1000 ${step === 'final' ? 'scale-90 opacity-0' : 'scale-100 opacity-100'}`}>

                {/* Close Button */}
                <div className="absolute top-8 left-8">
                    <Link href="/">
                        <button className="text-white/30 hover:text-white transition-all transform hover:scale-110">
                            <ArrowLeft size={20} />
                        </button>
                    </Link>
                </div>

                {/* Avatar with Inner Glow */}
                <div className="w-24 h-24 mx-auto mb-10 relative">
                    <div className="absolute inset-0 rounded-3xl bg-amber-200/20 blur-2xl animate-pulse"></div>
                    <img
                        src="/Mr.OWL.jpg"
                        alt="Mr.OWL"
                        className={`relative w-full h-full rounded-3xl border border-white/20 object-cover shadow-2xl transition-all duration-2000 ${step === 'containment' ? 'grayscale opacity-50' : ''}`}
                    />
                </div>

                <div className="min-h-[240px] flex flex-col items-center justify-center text-center space-y-8">

                    {step === 'question' && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 w-full">
                            <h2 className="text-3xl font-thin tracking-tighter leading-tight">
                                今日も、お疲れ様でした。<br />
                                <span className="opacity-50 text-lg block mt-2">誰かの『力』になれた瞬間はありましたか？</span>
                            </h2>
                            <div className="grid grid-cols-1 gap-3 w-full max-w-xs mx-auto">
                                <button onClick={() => handleResponse('yes')} className="py-4 px-6 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/10 transition-all font-bold text-xs uppercase tracking-widest hover:translate-y-[-2px]">
                                    はい、ありました
                                </button>
                                <button onClick={() => handleResponse('little')} className="py-4 px-6 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/10 transition-all font-bold text-xs uppercase tracking-widest hover:translate-y-[-2px]">
                                    少しだけ
                                </button>
                                <button onClick={() => handleResponse('no')} className="py-4 px-6 bg-transparent hover:text-white/60 text-white/30 rounded-2xl transition-all font-bold text-[10px] uppercase tracking-[0.2em]">
                                    今日は特に...
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'input' && (
                        <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                            <div className="space-y-2">
                                <h2 className="text-2xl font-thin tracking-tight">素晴らしい。</h2>
                                <p className="text-[10px] font-black text-amber-200/60 uppercase tracking-[0.2em]">知恵の記録</p>
                            </div>
                            <textarea
                                value={wisdom}
                                onChange={(e) => setWisdom(e.target.value)}
                                placeholder="その『力』になれたエピソードを少しだけ記してください..."
                                className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-6 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-amber-200/50 resize-none transition-all"
                            />
                            <button
                                onClick={submitWisdom}
                                disabled={!wisdom.trim() || isSaving}
                                className="w-full py-5 bg-terracotta text-white font-bold rounded-2xl shadow-glow hover:bg-terracotta-light transition-all disabled:opacity-20 flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em]"
                            >
                                {isSaving ? '記録中...' : <>記録して終了 <Sparkles size={16} /></>}
                            </button>
                        </div>
                    )}

                    {step === 'containment' && (
                        <div className="space-y-6 animate-in fade-in duration-2000">
                            <h2 className="text-2xl font-thin leading-relaxed">
                                そんな日もあります。<br /><br />
                                <span className="text-lg opacity-40 italic">
                                    組織を守るために、「無理をしない」ことも<br />
                                    大切な任務の一つですから。
                                </span>
                            </h2>
                        </div>
                    )}

                </div>
            </div>

            {/* Final "It's All Right" Message */}
            <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-3000 ${step === 'final' ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`}>
                <h1 className="text-5xl md:text-7xl font-serif italic text-amber-200/80 tracking-[0.2em] drop-shadow-[0_0_50px_rgba(212,175,55,0.4)]">
                    お疲れ様でした。
                </h1>
            </div>

            {/* Fade to Black */}
            <div className={`fixed inset-0 bg-[#0A0A0A] pointer-events-none transition-opacity duration-[4000ms] z-50 ${step === 'final' ? 'opacity-90 delay-2000' : 'opacity-0'}`}></div>

        </div>
    );
}
