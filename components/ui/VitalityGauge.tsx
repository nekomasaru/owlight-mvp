import React from 'react';
import { Sparkles, Activity } from 'lucide-react';

interface VitalityGaugeProps {
    value: number;       // Now represents OWL Points (Virtue)
    max?: number;        // Not used anymore but kept for compatibility
    label?: string;      // Label text
    isInfinite?: boolean; // Not used anymore
}

export default function VitalityGauge({ value, label = "Virtue", compressed = false }: VitalityGaugeProps & { compressed?: boolean }) {
    if (compressed) {
        return (
            <div className="flex flex-col items-center justify-center p-2 bg-white/50 backdrop-blur-sm border border-terracotta/20 rounded-xl shadow-sm hover:border-terracotta/40 transition-all cursor-help group" title={`${label}: ${value} pts`}>
                <Sparkles size={14} className="text-terracotta mb-1 group-hover:animate-spin-slow" />
                <span className="text-[10px] font-black text-terracotta tabular-nums leading-none">
                    {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
                </span>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-1 min-w-[120px] cursor-help" title={`${label}: ${value} pts`}>
            <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-taupe-light">
                <span className="flex items-center gap-1">
                    <Sparkles size={10} className="text-terracotta" />
                    OWLポイント
                </span>
            </div>

            {/* Point Display */}
            <div className="relative overflow-hidden bg-white/50 backdrop-blur-sm border border-terracotta/20 rounded-xl px-4 py-2 shadow-sm group hover:shadow-glow hover:border-terracotta/40 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-terracotta/5 to-transparent opacity-50" />

                <div className="relative flex items-baseline gap-1 justify-center">
                    <span className="text-2xl font-black text-terracotta tracking-tight tabular-nums">
                        {value.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-bold text-terracotta/60 uppercase">pts</span>
                </div>

                {/* Shine effect */}
                <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-shimmer" />
            </div>
        </div>
    );
}
