'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { OmotenahiAlert } from '@/components/ui/OmotenahiAlert';
import { OmotenashiMessageType } from '@/lib/omotenashiMessages';
import { UserContext } from './UserContext';

type Toast = {
    id: string;
    type: OmotenashiMessageType;
    title: string;
    message: string;
    action?: {
        label: string;
        onClick: () => void;
    };
};

type ToastContextType = {
    showToast: (type: OmotenashiMessageType, title: string, message: string, action?: Toast['action']) => void;
    showError: (title: string, message: string) => void;
    showSuccess: (title: string, message: string) => void;
    showInfo: (title: string, message: string) => void;
    showWarning: (title: string, message: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    // Get User Context
    const userContext = React.useContext(UserContext); // Safe since ToastProvider is usually inside UserProvider? No, usually outside.
    // Wait, ToastProvider is often at root. UserProvider might be inside.
    // If ToastProvider is outside UserProvider, we cannot use useUser().
    // We should check App.tsx or layout.tsx structure. 
    // Assuming UserProvider is inside for now, we might need to handle this differently.
    // However, usually Toast is global.
    // Let's check layout.tsx.

    // For now, assuming we CAN acess UserContext if we move ToastProvider inside, or if UserProvider is root.
    // Actually, usually Providers are:
    // <AuthProvider> <UserProvider> <ToastProvider> ... </ToastProvider> </UserProvider> </AuthProvider>

    // Let's implement the logic assuming we have access to user state.
    // If not, we might need to push this logic up or down.

    const { user, addPendingNotification, clearPendingNotifications } = useUserSafe();
    // useUserSafe is a helper we'll define locally to avoid strict null checks if used outside context (fails gracefully)

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const showToast = useCallback((type: OmotenashiMessageType, title: string, message: string, action?: Toast['action']) => {
        // FOCUS MODE CHECK
        if (user?.focusMode && type !== 'error') {
            // Queue it
            if (addPendingNotification) {
                addPendingNotification({ type, title, message, action, createdAt: new Date().toISOString() });
            }
            return; // Suppress
        }

        const id = Math.random().toString(36).substring(7);
        setToasts(prev => [...prev, { id, type, title, message, action }]);

        // Auto dismiss after 5 seconds
        setTimeout(() => {
            removeToast(id);
        }, 5000);
    }, [removeToast, user?.focusMode, addPendingNotification]);

    // Watch for Focus Mode OFF -> Summary
    useEffect(() => {
        if (!user) return;

        // If focus mode just turned OFF
        // We need previous state to detect change? Or just check if focusMode is false and we have pending.
        // But this attempts to show summary every render if focusMode is false and we have pending.
        // Which is exactly what we want - as soon as we wake up, show summary and clear.

        if (!user.focusMode && user.pendingNotifications && user.pendingNotifications.length > 0) {
            const count = user.pendingNotifications.length;
            const summaryMessage = `おかえりなさい。集中している間に、${count}件の通知が「知恵の泉」に届きました。`;

            // Show summary toast
            const id = Math.random().toString(36).substring(7);
            setToasts(prev => [...prev, {
                id,
                type: 'info',
                title: 'お疲れ様でした',
                message: summaryMessage
            }]);
            setTimeout(() => removeToast(id), 8000);

            // Clear queue
            if (clearPendingNotifications) clearPendingNotifications();
        }
    }, [user?.focusMode, user?.pendingNotifications, clearPendingNotifications]);

    const showError = useCallback((title: string, message: string) => showToast('error', title, message), [showToast]);
    const showSuccess = useCallback((title: string, message: string) => showToast('success', title, message), [showToast]);
    const showInfo = useCallback((title: string, message: string) => showToast('info', title, message), [showToast]);
    const showWarning = useCallback((title: string, message: string) => showToast('warning', title, message), [showToast]);

    return (
        <ToastContext.Provider value={{ showToast, showError, showSuccess, showInfo, showWarning }}>
            {children}
            <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-md w-full pointer-events-none">
                {toasts.map(toast => (
                    <div key={toast.id} className="pointer-events-auto">
                        <OmotenahiAlert
                            type={toast.type}
                            title={toast.title}
                            message={toast.message}
                            action={toast.action}
                            onDismiss={() => removeToast(toast.id)}
                            className="shadow-lg border-2"
                        />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}


function useUserSafe() {
    const context = useContext(UserContext);
    return context || { user: null, addPendingNotification: null, clearPendingNotifications: null };
}

export function useToast() {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
