"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, UserRole } from '@/types';

// Predefined mock users (Personas)
export const PERSONAS: Record<UserRole, User> = {
    new_hire: {
        id: 'suzuki_01',
        name: 'Suzuki (New Hire)',
        role: 'new_hire',
        department: 'General Affairs',
        points: 120,
        stamina: 80,
    },
    veteran: {
        id: 'sato_02',
        name: 'Sato (Veteran)',
        role: 'veteran',
        department: 'City Planning',
        points: 850,
        stamina: 60,
    },
    manager: {
        id: 'tanaka_03',
        name: 'Tanaka (Manager)',
        role: 'manager',
        department: 'Administration',
        points: 3200,
        stamina: 40,
    },
};

type UserContextType = {
    user: User;
    switchUser: (role: UserRole) => void;
    availableRoles: UserRole[];
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    // Default to 'new_hire' (Suzuki)
    const [user, setUser] = useState<User>(PERSONAS.new_hire);

    const switchUser = (role: UserRole) => {
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
