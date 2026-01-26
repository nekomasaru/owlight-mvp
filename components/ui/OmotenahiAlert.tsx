'use client';

import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { OmotenashiMessageType } from '@/lib/omotenashiMessages';

interface OmotenahiAlertProps {
    type: OmotenashiMessageType;
    title: string;
    message: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    onDismiss?: () => void;
    className?: string;
}

const typeStyles: Record<OmotenashiMessageType, { bg: string; border: string; icon: string; iconBg: string }> = {
    error: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: 'text-red-500',
        iconBg: 'bg-red-100'
    },
    warning: {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        icon: 'text-amber-500',
        iconBg: 'bg-amber-100'
    },
    success: {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        icon: 'text-emerald-500',
        iconBg: 'bg-emerald-100'
    },
    info: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: 'text-blue-500',
        iconBg: 'bg-blue-100'
    }
};

const IconComponent: Record<OmotenashiMessageType, React.FC<{ size?: number; className?: string }>> = {
    error: AlertCircle,
    warning: AlertTriangle,
    success: CheckCircle,
    info: Info
};

export const OmotenahiAlert: React.FC<OmotenahiAlertProps> = ({
    type,
    title,
    message,
    action,
    onDismiss,
    className = ''
}) => {
    const styles = typeStyles[type];
    const Icon = IconComponent[type];

    return (
        <div
            className={`
                ${styles.bg} ${styles.border} border rounded-2xl p-4 
                shadow-sm animate-in fade-in slide-in-from-top-2 duration-300
                ${className}
            `}
            role="alert"
        >
            <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`${styles.iconBg} p-2 rounded-full flex-shrink-0`}>
                    <Icon size={20} className={styles.icon} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-800 mb-1">{title}</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">{message}</p>

                    {/* Action Button */}
                    {action && (
                        <button
                            onClick={action.onClick}
                            className={`
                                mt-3 px-4 py-2 text-sm font-bold rounded-lg
                                ${type === 'error' ? 'bg-red-500 hover:bg-red-600 text-white' : ''}
                                ${type === 'warning' ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}
                                ${type === 'success' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : ''}
                                ${type === 'info' ? 'bg-blue-500 hover:bg-blue-600 text-white' : ''}
                                transition-colors
                            `}
                        >
                            {action.label}
                        </button>
                    )}
                </div>

                {/* Dismiss Button */}
                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="p-1 rounded-full hover:bg-slate-200/50 transition-colors flex-shrink-0"
                        aria-label="閉じる"
                    >
                        <X size={16} className="text-slate-400" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default OmotenahiAlert;
