"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, UserRole } from '@/types';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

// Predefined mock users (Personas)
export const PERSONAS: Record<UserRole, User> = {
    new_hire: {
        id: 'suzuki_01',
        name: 'Suzuki (New Hire)',
        role: 'new_hire',
        department: 'General Affairs',
        points: 120,
        stamina: 9999, // Effectively infinite
        mentorMode: true,
        timeSaved: 5,
        thanksCount: 2,
    },
    veteran: {
        id: 'sato_02',
        name: 'Sato (Veteran)',
        role: 'veteran',
        department: 'City Planning',
        points: 850,
        stamina: 60,
        mentorMode: false,
        timeSaved: 45,
        thanksCount: 12,
    },
    manager: {
        id: 'tanaka_03',
        name: 'Tanaka (Manager)',
        role: 'manager',
        department: 'Administration',
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
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const [currentRoleId, setCurrentRoleId] = useState<UserRole>('new_hire');
    const [user, setUser] = useState<User>(PERSONAS.new_hire);

    useEffect(() => {
        const targetId = PERSONAS[currentRoleId].id;

        // Subscribe to Firestore for real-time updates (Stamina, etc.)
        const unsubscribe = onSnapshot(doc(db, "users", targetId), (docSnap) => {
            if (docSnap.exists()) {
                setUser({ ...docSnap.data() } as User);
            } else {
                // Fallback to static if not found in DB
                setUser(PERSONAS[currentRoleId]);
            }
        }, (error) => {
            // If there's an error, fall back to the persona data
            setUser(PERSONAS[currentRoleId]);
        });

        return () => unsubscribe();
    }, [currentRoleId]);

    const switchUser = (role: UserRole) => {
        setCurrentRoleId(role);
        setUser(PERSONAS[role]);
    };

    const availableRoles = Object.keys(PERSONAS) as UserRole[];

    return (
        <UserContext.Provider value={{ user, switchUser, availableRoles }}>
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
