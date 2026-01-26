"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, UserRole } from '@/types';
import { supabase } from '@/src/lib/supabase';

// Predefined mock users (Personas)
export const PERSONAS: Record<UserRole, User> = {
    new_hire: {
        id: 'suzuki_01',
        name: '鈴木 一郎',
        role: 'new_hire',
        department: '市民生活部 市民課',
        points: 120,
        stamina: 9999, // Effectively infinite
        mentorMode: true,
        timeSaved: 5,
        thanksCount: 2,
    },
    veteran: {
        id: 'sato_02',
        name: '佐藤 花子',
        role: 'veteran',
        department: '市民生活部 市民課 (係長)',
        points: 850,
        stamina: 60,
        mentorMode: false,
        timeSaved: 45,
        thanksCount: 12,
    },
    manager: {
        id: 'tanaka_03',
        name: '田中 剛',
        role: 'manager',
        department: '市民生活部',
        points: 3200,
        stamina: 40,
        mentorMode: false,
        timeSaved: 120,
        thanksCount: 25,
    },
};

type UserContextType = {
    user: User;
    switchUser: (role: UserRole) => void;
    availableRoles: UserRole[];
    updatePointsOptimistically: (pointsDelta: number) => void;
    updateUserOption: (key: string, value: any) => Promise<void>;
    toggleFocusMode: () => void;
    addPendingNotification: (notification: any) => Promise<void>;
    clearPendingNotifications: () => Promise<void>;
    toggleTheme: () => void;
};

export const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const [currentRoleId, setCurrentRoleId] = useState<UserRole>('new_hire');
    const [user, setUser] = useState<User>(PERSONAS.new_hire);

    useEffect(() => {
        const targetId = PERSONAS[currentRoleId].id;

        // 1. Initial Fetch via API
        const fetchUser = async () => {
            try {
                // Determine if user exists in DB, otherwise use default
                // Using API we created earlier to check/get user
                const res = await fetch(`/api/users?id=${targetId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.user) {
                        setUser(data.user);
                        return;
                    }
                }

                // If user not found, register automatically using Persona data
                const persona = PERSONAS[currentRoleId];
                console.log(`User ${targetId} not found, registering automatically...`);

                await fetch('/api/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: persona.id,
                        name: persona.name,
                        role: persona.role,
                        department: persona.department,
                        points: persona.points,
                        stamina: persona.stamina,
                        mentorMode: persona.mentorMode,
                        timeSaved: persona.timeSaved,
                        thanksCount: persona.thanksCount
                    })
                });

                setUser(persona);

            } catch (error) {
                console.error("Failed to fetch/register user:", error);
                setUser(PERSONAS[currentRoleId]);
            }
        };

        fetchUser();

        // 2. Realtime Subscription via Supabase
        const channel = supabase
            .channel(`user_updates_${targetId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'users',
                    filter: `id=eq.${targetId}`
                },
                (payload) => {
                    const updatedUser = payload.new as any;
                    // Map snake_case to camelCase types if necessary, though our schema matches mostly
                    // Assuming schema is compatible or mapped correctly
                    setUser(prev => ({
                        ...prev,
                        points: updatedUser.points ?? prev.points,
                        stamina: updatedUser.stamina ?? prev.stamina,
                        timeSaved: updatedUser.time_saved_minutes ?? prev.timeSaved,
                        thanksCount: updatedUser.thanks_count ?? prev.thanksCount,
                        sidebarCollapsed: updatedUser.sidebar_collapsed ?? prev.sidebarCollapsed
                    }));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentRoleId]);

    // Theme Effect
    useEffect(() => {
        const theme = user.theme || 'light';
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [user.theme]);

    const switchUser = (role: UserRole) => {
        setCurrentRoleId(role);
        // Optimistic update
        setUser(PERSONAS[role]);
    };

    const updatePointsOptimistically = (pointsDelta: number) => {
        setUser(prev => ({
            ...prev,
            points: (prev.points || 0) + pointsDelta
        }));
    };

    const updateUserOption = async (key: string, value: any) => {
        // Optimistic update
        setUser(prev => ({ ...prev, [key]: value }));

        try {
            // Map camelCase to snake_case for DB if needed
            const dbKey = key === 'sidebarCollapsed' ? 'sidebar_collapsed' : key;

            await fetch('/api/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: user.id,
                    [dbKey]: value
                })
            });
        } catch (e) {
            console.error('Failed to update user option:', e);
        }
    };

    const toggleFocusMode = () => {
        const newFocusMode = !user.focusMode;
        // Optimistic update
        setUser(prev => ({ ...prev, focusMode: newFocusMode }));
        updateUserOption('focusMode', newFocusMode);
    };

    const toggleTheme = () => {
        const newTheme = user.theme === 'dark' ? 'light' : 'dark';
        // Optimistic update
        setUser(prev => ({ ...prev, theme: newTheme as 'light' | 'dark' }));
        updateUserOption('theme', newTheme);
    };

    const addPendingNotification = async (notification: any) => {
        const currentPending = user.pendingNotifications || [];
        const newPending = [...currentPending, notification];

        // Optimistic
        setUser(prev => ({ ...prev, pendingNotifications: newPending }));

        // Persist (debounce could be good here but keeping it simple for now)
        await updateUserOption('pendingNotifications', newPending);
    };

    const clearPendingNotifications = async () => {
        // Optimistic
        setUser(prev => ({ ...prev, pendingNotifications: [] }));
        await updateUserOption('pendingNotifications', []);
    };

    const availableRoles = Object.keys(PERSONAS) as UserRole[];

    return (
        <UserContext.Provider value={{ user, switchUser, availableRoles, updatePointsOptimistically, updateUserOption, toggleFocusMode, addPendingNotification, clearPendingNotifications, toggleTheme }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
