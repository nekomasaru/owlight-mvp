"use client";

import React from 'react';
import { useUser } from '@/contexts/UserContext';
import { UserRole } from '@/types';

export default function UserSwitcher() {
    const { user, switchUser, availableRoles } = useUser();

    const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        switchUser(e.target.value as UserRole);
    };

    return (
        <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-200 shadow-sm text-sm">
            <span className="text-slate-500 text-xs font-medium">As:</span>
            <select
                value={user.role}
                onChange={handleRoleChange}
                className="bg-transparent font-semibold text-slate-700 focus:outline-none cursor-pointer hover:text-indigo-600 transition-colors"
            >
                {availableRoles.map((role) => (
                    <option key={role} value={role}>
                        {role === 'new_hire' && '🐣 Suzuki'}
                        {role === 'veteran' && '🦅 Sato'}
                        {role === 'manager' && '🦁 Tanaka'}
                        {!['new_hire', 'veteran', 'manager'].includes(role) && role}
                    </option>
                ))}
            </select>
        </div>
    );
}
