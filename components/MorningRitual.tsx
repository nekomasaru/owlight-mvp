'use client';

import React, { useState, useEffect } from 'react';
import { Scale, Flame, Sprout, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MorningRitual() {
    const router = useRouter();
    const [isVisible, setIsVisible] = useState(false);
    const [selectedCard, setSelectedCard] = useState<string | null>(null);
    const [showPledge, setShowPledge] = useState(false);
    const [pledgeText, setPledgeText] = useState('');

    useEffect(() => {
        const lastRitual = localStorage.getItem('lastMorningRitual');
        const today = new Date().toDateString();
        const params = new URLSearchParams(window.location.search);

        if (params.get('ritual') === 'reset') {
            localStorage.removeItem('lastMorningRitual');
            setIsVisible(true);
            return;
        }

        if (lastRitual !== today) {
            setIsVisible(true);
        }
    }, []);

    const handleSelect = (key: string, label: string) => {
        setSelectedCard(key);
        setPledgeText(`「${label}」を胸に。`);

        setTimeout(() => {
            setShowPledge(true);
        }, 800);
    };

    const completeRitual = () => {
        const today = new Date().toDateString();
        localStorage.setItem('lastMorningRitual', today);
        setIsVisible(false);
        router.push('/engagement');
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden font-sans antialiased">
            {/* Background: Refined Sunrise */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#E0EAFC] to-[#CFDEF3] animate-[pulse_15s_infinite_alternate]"
                style={{ backgroundSize: '200% 200%' }}>
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-pink-200/20 blur-[120px] rounded-full"></div>
            </div>

            <div className="relative z-10 text-center max-w-5xl w-full p-8 animate-in fade-in zoom-in duration-1000">

                {/* Avatar (Subtle Glow) */}
                <div className="mb-12 relative w-24 h-24 mx-auto">
                    <div className="absolute inset-0 rounded-3xl bg-white blur-2xl opacity-40 animate-pulse"></div>
                    <img
                        src="/Mr.OWL.jpg"
                        alt="Mr.OWL"
                        className="relative w-full h-full rounded-3xl border border-white/50 shadow-premium object-cover"
                    />
                </div>

                <div className="mb-14 space-y-4">
                    <h2 className="text-5xl font-thin tracking-tighter text-taupe drop-shadow-sm">Good Morning.</h2>
                    <p className="text-lg font-medium text-taupe-light/80 tracking-wide">
                        おはようございます。<br />
                        今日、あなたが一番大切にしたい『価値』を一つ選んでください。
                    </p>
                </div>

                {/* Cards Container */}
                <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 px-4 transition-all duration-1000 transform ${showPledge ? 'opacity-0 scale-95 pointer-events-none translate-y-4' : 'opacity-100 scale-100'}`}>

                    {[
                        { id: 'integrity', label: '誠実さ', en: 'Integrity', icon: <Scale size={28} />, color: 'text-indigo-500', bg: 'bg-indigo-50', text: '見えないところでも、正しい判断をする心' },
                        { id: 'challenge', label: '挑戦', en: 'Challenge', icon: <Flame size={28} />, color: 'text-terracotta', bg: 'bg-terracotta/10', text: '昨日より一つでも、新しいことを試す勇気' },
                        { id: 'kindness', label: '優しさ', en: 'Kindness', icon: <Sprout size={28} />, color: 'text-sage', bg: 'bg-sage/10', text: '関わるすべての人へ、敬意と配慮を持つ心' }
                    ].map(card => (
                        <button
                            key={card.id}
                            onClick={() => handleSelect(card.id, card.label)}
                            className={`group relative bg-white/40 backdrop-blur-2xl p-10 rounded-[2.5rem] text-left transition-all duration-500 border border-white/50 hover:bg-white/60 hover:shadow-premium hover:-translate-y-2 ${selectedCard === card.id ? 'ring-2 ring-terracotta/20 scale-105' : ''}`}
                        >
                            <div className={`w-14 h-14 ${card.bg} ${card.color} rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform`}>
                                {card.icon}
                            </div>
                            <h3 className="text-2xl font-bold text-taupe mb-1 tracking-tight">{card.label}</h3>
                            <p className="text-[10px] font-black text-taupe-light/40 uppercase tracking-[0.2em] mb-4">{card.en}</p>
                            <p className="text-sm text-taupe-light font-medium leading-relaxed">
                                {card.text}
                            </p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Pledge Overlay (Premium Glass) */}
            <div className={`absolute inset-0 bg-white/90 backdrop-blur-3xl flex flex-col items-center justify-center transition-all duration-1000 ${showPledge ? 'opacity-100 z-20' : 'opacity-0 pointer-events-none invisible'}`}>
                <div className={`text-center transition-all duration-1000 ${showPledge ? 'scale-100 translate-y-0' : 'scale-90 translate-y-8'}`}>
                    <h2 className="text-4xl font-bold text-taupe mb-6 tracking-tighter">{pledgeText}</h2>
                    <p className="text-taupe-light font-medium text-lg mb-12 max-w-md leading-relaxed">
                        その想いがあれば、今日もきっとうまくいきます。<br />
                        静かな自信を持って、一日のスタートを。
                    </p>
                    <button
                        onClick={completeRitual}
                        className="mx-auto flex items-center gap-4 bg-terracotta text-white px-10 py-5 rounded-full font-bold hover:bg-terracotta-light transition-all shadow-glow hover:scale-105 active:scale-95 text-sm tracking-widest uppercase"
                    >
                        ダッシュボードへ進む <ArrowRight size={18} />
                    </button>
                </div>
            </div>

        </div>
    );
}
