'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../src/lib/supabase';
import { ChatMessage, ChatSession } from '../src/domain/types';

/**
 * Hook for managing chat sessions with Supabase Realtime
 */
export function useChatSessions(userId: string) {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
    const PAGE_SIZE = 20;

    // Fetch sessions with pagination
    const fetchSessions = useCallback(async (pageNum: number = 0, concat: boolean = false) => {
        if (pageNum > 0) setIsFetchingMore(true);
        else setIsLoading(true);

        try {
            const offset = pageNum * PAGE_SIZE;
            const res = await fetch(`/api/chat/sessions?userId=${userId}&limit=${PAGE_SIZE}&offset=${offset}`);
            const data = await res.json();

            if (data.sessions) {
                const fetchedSessions = data.sessions.map((s: any) => ({
                    id: s.id,
                    title: s.title,
                    updatedAt: s.updatedAt
                }));

                if (fetchedSessions.length < PAGE_SIZE) {
                    setHasMore(false);
                } else {
                    setHasMore(true);
                }

                setSessions(prev => {
                    const existing = concat ? prev : [];
                    // Preserve optimistic sessions
                    const optimistic = prev.filter(s => s.id.startsWith('session_'));
                    const filteredOptimistic = optimistic.filter(o => !fetchedSessions.some((f: any) => f.id === o.id));

                    // Combine existing, newly fetched, and unique optimistic sessions
                    const combined = [...existing, ...fetchedSessions];
                    const uniqueCombined = Array.from(new Map(combined.map(s => [s.id, s])).values()) as ChatSession[];

                    return [...uniqueCombined, ...filteredOptimistic];
                });
            }
        } catch (error) {
            console.error('Error fetching sessions:', error);
        } finally {
            setIsLoading(false);
            setIsFetchingMore(false);
        }
    }, [userId]);

    const loadMore = useCallback(() => {
        if (hasMore && !isFetchingMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchSessions(nextPage, true);
        }
    }, [hasMore, isFetchingMore, page, fetchSessions]);

    // Set up Realtime subscription
    useEffect(() => {
        fetchSessions(0, false);
        setPage(0);

        // Subscribe to changes in chat_sessions table for this user
        const channel = supabase
            .channel(`chat_sessions_${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'chat_sessions',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const newSession = payload.new as any;
                        setSessions(prev => {
                            // Dedupe: If session with same ID already exists, do nothing
                            if (prev.some(s => s.id === newSession.id)) return prev;

                            return [
                                {
                                    id: newSession.id,
                                    userId: newSession.user_id,
                                    title: newSession.title,
                                    updatedAt: newSession.updated_at
                                } as ChatSession,
                                ...prev
                            ];
                        });
                    } else if (payload.eventType === 'UPDATE') {
                        const updated = payload.new as any;
                        setSessions(prev => {
                            const filtered = prev.filter(s => s.id !== updated.id);
                            return [
                                {
                                    id: updated.id,
                                    userId: updated.user_id,
                                    title: updated.title,
                                    updatedAt: updated.updated_at
                                } as ChatSession,
                                ...filtered
                            ];
                        });
                    } else if (payload.eventType === 'DELETE') {
                        const deleted = payload.old as any;
                        setSessions(prev => prev.filter(s => s.id !== deleted.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, fetchSessions]);

    const createSession = async (title: string): Promise<string | null> => {
        // Optimistic update
        const tempId = `session_${Date.now()}`;
        const now = new Date().toISOString();
        setSessions(prev => [
            { id: tempId, userId, title, updatedAt: now } as ChatSession,
            ...prev
        ]);

        try {
            const res = await fetch('/api/chat/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'createSession',
                    userId,
                    title
                })
            });
            const data = await res.json();

            // Replace temp session with real one if needed
            if (data.session?.id) {
                setSessions(prev => {
                    // If Realtime already added the real ID, just remove the temp one
                    if (prev.some(s => s.id === data.session.id)) {
                        return prev.filter(s => s.id !== tempId);
                    }
                    // Otherwise swap temp ID with real ID
                    return prev.map(s => s.id === tempId ? { ...s, id: data.session.id } : s);
                });
                return data.session.id;
            }
            return null;
        } catch (error) {
            console.error('Error creating session:', error);
            // Revert optimistic update
            setSessions(prev => prev.filter(s => s.id !== tempId));
            return null;
        }
    };

    // Ensure uniqueness before returning
    // Ensure uniqueness before returning
    const uniqueSessions = useMemo(() => {
        return Array.from(new Map(sessions.map(s => [s.id, s])).values())
            .sort((a, b) => new Date(b.updatedAt as string).getTime() - new Date(a.updatedAt as string).getTime());
    }, [sessions]);

    return {
        sessions: uniqueSessions,
        isLoading,
        isFetchingMore,
        hasMore,
        loadMore,
        createSession,
        refetch: () => fetchSessions(0, false)
    };
}

/**
 * Hook for managing chat messages with Supabase Realtime
 */
export function useChatMessages(sessionId: string | null) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch messages for session
    const fetchMessages = useCallback(async () => {
        if (!sessionId) {
            setMessages([]);
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`/api/chat/sessions?sessionId=${sessionId}`);
            const data = await res.json();
            if (data.messages) {
                const fetchedMessages = data.messages.map((m: any) => ({
                    id: m.id,
                    role: m.role,
                    content: m.content,
                    citations: m.citations
                }));

                setMessages(prev => {
                    // Preserve optimistic messages (starting with temp_)
                    const optimistic = prev.filter(m => m.id.startsWith('temp_'));
                    return [...fetchedMessages, ...optimistic];
                });
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setIsLoading(false);
        }
    }, [sessionId]);

    // Set up Realtime subscription for messages
    useEffect(() => {
        fetchMessages();

        if (!sessionId) return;

        const channel = supabase
            .channel(`chat_messages_${sessionId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `session_id=eq.${sessionId}`
                },
                (payload) => {
                    const newMsg = payload.new as any;
                    setMessages(prev => {
                        // Avoid duplicates if message already exists by ID
                        if (prev.some(m => m.id === newMsg.id)) return prev;

                        // Remove optimistic message if content matches (deduplication strategy)
                        const filtered = prev.filter(m =>
                            !(m.id?.startsWith('temp_') && m.content === newMsg.content && m.role === newMsg.role)
                        );

                        return [...filtered, {
                            id: newMsg.id,
                            sessionId: newMsg.session_id,
                            role: newMsg.role,
                            content: newMsg.content,
                            citations: newMsg.citations,
                            createdAt: newMsg.created_at
                        } as ChatMessage];
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [sessionId, fetchMessages]);

    const sendMessage = async (msg: Omit<ChatMessage, 'id' | 'createdAt' | 'sessionId'>, targetSessionId?: string) => {
        const currentSessionId = targetSessionId || sessionId;
        if (!currentSessionId) return;

        // Optimistic update
        const tempId = `temp_${Date.now()}`;
        try {
            const optimisticMsg: ChatMessage = {
                ...msg,
                id: tempId,
                sessionId: currentSessionId,
                createdAt: new Date().toISOString(),
                citations: msg.citations || []
            };

            setMessages(prev => [...prev, optimisticMsg]);

            // Persist to DB
            const { error } = await supabase
                .from('chat_messages')
                .insert({
                    session_id: currentSessionId,
                    role: msg.role,
                    content: msg.content,
                    citations: msg.citations
                });

            if (error) {
                console.error('Failed to send message:', error);
                // Remove optimistic message on error
                setMessages(prev => prev.filter(m => m.id !== tempId));
            }
        } catch (e) {
            console.error('Error sending message:', e);
            setMessages(prev => prev.filter(m => m.id !== tempId));
        }
    };

    // Ensure uniqueness before returning
    const uniqueMessages = useMemo(() => {
        return Array.from(new Map(messages.map(m => [m.id!, m])).values());
    }, [messages]);

    return { messages: uniqueMessages, isLoading, sendMessage, refetch: fetchMessages };
}
