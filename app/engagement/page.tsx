import React from 'react';
import { Card } from '@/components/ui/Card';
import { User } from '@/types';

export default function EngagementPage() {
    // Static user data
    const user: User = {
        name: 'Taro',
        points: 10,
    };

    return (
        <div className="flex justify-center items-center h-full pt-10">
            <Card title="Engagement Profile" className="w-full max-w-md">
                <div className="flex flex-col items-center space-y-6">
                    <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 p-[2px]">
                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-3xl font-bold text-indigo-600">
                            {user.name.charAt(0)}
                        </div>
                    </div>

                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-800">{user.name}</h2>
                        <p className="text-sm text-gray-500 mt-1">Basic Member</p>
                    </div>

                    <div className="w-full grid grid-cols-1 gap-4">
                        <div className="bg-indigo-50 rounded-xl p-4 text-center border border-indigo-100">
                            <p className="text-sm font-medium text-indigo-600 mb-1">Current Points</p>
                            <p className="text-4xl font-extrabold text-indigo-700">{user.points}</p>
                        </div>
                    </div>

                    <div className="w-full pt-4 border-t border-gray-100">
                        <p className="text-xs text-center text-gray-400">
                            Last updated: Just now
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
}
