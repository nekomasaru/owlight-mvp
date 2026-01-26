import React from 'react';
import { Leaf, Wind, Sun, Droplets, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card'; // Assuming generic card or we use the local one. I'll use a local styled div for flexibility matching page.

// Local Card for self-containment if needed, or just standard div structure
const VitalityCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`bg-white dark:bg-card rounded-2xl border border-sage/20 shadow-sm p-6 ${className}`}>
        {children}
    </div>
);

export default function ForestVitality() {
    return (
        <VitalityCard className="relative overflow-hidden border-l-4 border-l-sage">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-sage/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-terracotta/5 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />

            <div className="relative flex flex-col md:flex-row items-center gap-8">

                {/* Visual: The Ecosystem Symbol */}
                <div className="relative shrink-0">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#E8F5E9] to-[#C8E6C9] flex items-center justify-center relative z-10 shadow-inner overflow-hidden">
                        {/* Organic Pulse Effect - Standard Tailwind */}
                        <div className="absolute inset-0 bg-sage opacity-20 animate-pulse rounded-full" />

                        <Leaf size={56} className="text-[#2E7D32] relative z-10" strokeWidth={1.5} />

                        {/* Shine Effect - Simple opacity pulse or manual translate if shine fails */}
                        <div className="absolute -inset-full top-0 block h-full w-1/2 -skew-x-12 bg-white opacity-20 animate-pulse" />
                    </div>

                    {/* Ring */}
                    <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#A5D6A7] animate-spin-slow opacity-50" style={{ animationDuration: '20s' }} />
                    <div className="absolute -inset-2 rounded-full border border-sage/20 opacity-30 scale-110" />
                </div>

                {/* Content: The Narrative */}
                <div className="flex-1 text-center md:text-left space-y-3">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-full bg-sage/10 text-sage-dark text-[10px] font-bold uppercase tracking-wider">
                            現在の状況
                        </span>
                        <div className="flex items-center gap-1 text-xs font-bold text-terracotta">
                            <TrendingUp size={14} />
                            <span>循環効率: 104%</span>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-foreground">
                        ナレッジの森は、<span className="text-sage-dark relative inline-block">
                            理想的な循環
                            <span className="absolute bottom-0 left-0 w-full h-1 bg-sage/30 -z-10 rounded-full" />
                        </span>
                        の中にあります。
                    </h2>

                    <div className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                        <p>
                            素晴らしい成果です。あなたのこれまでの貢献により、組織全体のナレッジ循環係数は <span className="font-bold text-foreground">98.4%</span> に達しました。
                        </p>
                        <p className="mt-1 font-medium text-sage-dark/80">
                            "枯れることのない土壌が、次の芽吹きを支えています。"
                        </p>
                    </div>
                </div>

                {/* Stats / Metrics (Optional Sidebar in Card) */}
                <div className="flex flex-row md:flex-col gap-4 text-center border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-8">
                    <div>
                        <div className="text-2xl font-bold text-foreground">12,450</div>
                        <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">知恵の総数 (Seeds)</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-sage-dark">+35</div>
                        <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">新たな芽吹き</div>
                    </div>
                </div>
            </div>
        </VitalityCard>
    );
}
