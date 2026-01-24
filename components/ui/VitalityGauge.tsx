import React from 'react';
import { Zap, Battery, BatteryCharging, BatteryWarning, BatteryFull, Activity } from 'lucide-react';

interface VitalityGaugeProps {
    value: number;       // Current stamina (0-100+)
    max?: number;        // Max stamina (default 100, if >100 treated as infinite)
    label?: string;      // Label text (default "Vitality")
    isInfinite?: boolean; // If true, show infinity symbol
}

export default function VitalityGauge({ value, max = 100, label = "Vitality", isInfinite = false }: VitalityGaugeProps) {
    // Determine color based on percentage
    // 80-100: Sage (Green/Healthy)
    // 40-79:  Amber (Caution)
    // 0-39:   Rose (Danger/Tired)

    // If infinite, always Sage
    const isHealthy = isInfinite || value >= 80;
    const isCaution = !isInfinite && value >= 40 && value < 80;
    const isDanger = !isInfinite && value < 40;

    const colorClass = isHealthy ? "bg-sage text-sage" :
        isCaution ? "bg-amber-400 text-amber-500" :
            "bg-red-400 text-red-500";

    const barColorClass = isHealthy ? "bg-sage" :
        isCaution ? "bg-amber-400" :
            "bg-red-400";

    // Calculate width percentage (clamped 0-100)
    const percentage = isInfinite ? 100 : Math.min(100, Math.max(0, (value / max) * 100));

    return (
        <div className="flex flex-col gap-1 min-w-[120px]">
            <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-taupe-light">
                <span className="flex items-center gap-1">
                    <Activity size={10} className={isDanger ? "animate-pulse text-red-500" : ""} />
                    {label}
                </span>
                <span className="font-mono">
                    {isInfinite ? "∞" : `${Math.round(value)}%`}
                </span>
            </div>

            {/* Gauge Bar */}
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner relative">
                {/* Background segments (optional for decoration) */}
                <div className="absolute inset-0 w-full h-full opacity-10 flex">
                    <div className="w-[40%] h-full bg-red-400"></div>
                    <div className="w-[40%] h-full bg-amber-400"></div>
                    <div className="w-[20%] h-full bg-sage"></div>
                </div>

                {/* Action Bar */}
                <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${barColorClass} ${isInfinite ? 'animate-pulse-slow' : ''}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
