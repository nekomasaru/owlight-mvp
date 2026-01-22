'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { User } from '@/types';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';

export default function EngagementPage() {
    const [points, setPoints] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Static user data (name only)
    const user: Omit<User, 'points'> = {
        name: 'Taro',
    };

    // Firestore Integration
    useEffect(() => {
        // Reference to the user document (using 'taro' as a fixed ID for this MVP)
        const userDocRef = doc(db, 'users', 'taro');

        // Real-time listener
        const unsubscribe = onSnapshot(userDocRef, async (docSnapshot) => {
            if (docSnapshot.exists()) {
                // If document exists, update state
                const data = docSnapshot.data();
                setPoints(data.points);
                setIsLoading(false);
            } else {
                // If document doesn't exist, create it with initial data
                try {
                    await setDoc(userDocRef, {
                        name: user.name,
                        points: 10 // Initial points
                    });
                    // The snapshot listener will fire again after creation
                } catch (error) {
                    console.error("Error creating initial document:", error);
                    setIsLoading(false);
                }
            }
        }, (error) => {
            console.error("Error fetching document:", error);
            setIsLoading(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    const handleThanks = async () => {
        if (points === null) return;

        try {
            const userDocRef = doc(db, 'users', 'taro');
            // Optimistic UI update could be done here, but for simplicity we rely on the snapshot listener
            await updateDoc(userDocRef, {
                points: points + 1
            });
        } catch (error) {
            console.error("Error updating points:", error);
        }
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
                            <p className="text-4xl font-extrabold text-indigo-700">
                                {isLoading ? (
                                    <span className="animate-pulse inline-block w-16 h-8 bg-indigo-200 rounded"></span>
                                ) : (
                                    points
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="w-full flex justify-center pt-2">
                        <Button
                            onClick={handleThanks}
                            disabled={isLoading}
                            className="w-full sm:w-auto min-w-[120px]"
                        >
                            感謝する
                        </Button>
                    </div>

                    <div className="w-full pt-4 border-t border-gray-100">
                        <p className="text-xs text-center text-gray-400">
                            Synced with Firestore
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
}
