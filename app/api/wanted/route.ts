import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/src/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status') || 'open';

        // Fetch ALL items (limit 100) to ensure we get user's new inputs
        // Filtering in JS is safer for JSONB fields across different DB adapters
        const { data, error } = await supabase
            .from('knowledge_base')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) {
            console.error('[GET /api/wanted] Supabase error:', error);
            throw error;
        }

        // JS Filtering with robust JSON parsing
        const filtered = (data || []).filter((item: any) => {
            let sd = item.structured_data;

            // Safety check: parse if string
            if (typeof sd === 'string') {
                try {
                    sd = JSON.parse(sd);
                } catch (e) {
                    console.warn('Failed to parse structured_data for item:', item.id);
                    return false;
                }
            }

            const isWanted = sd?.type === 'wanted';
            return isWanted; // Show all wanted items regardless of status for now
        });

        const sorted = filtered.sort((a, b) => {
            let sdA = a.structured_data;
            let sdB = b.structured_data;

            // Sort by me_too_count desc
            const countA = (typeof sdA === 'string' ? JSON.parse(sdA) : sdA)?.me_too_count || 0;
            const countB = (typeof sdB === 'string' ? JSON.parse(sdB) : sdB)?.me_too_count || 0;

            return countB - countA;
        });

        return NextResponse.json({ requests: sorted });
    } catch (error) {
        console.error('Error fetching wanted list:', error);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { title, content, userId } = body;

        const id = uuidv4();
        const now = new Date().toISOString();

        const { error } = await supabase
            .from('knowledge_base')
            .insert({
                id,
                title,
                content,
                created_by: userId || 'anonymous',
                created_at: now,
                updated_at: now,
                trust_tier: 3,
                source_type: 'user_submission',
                visibility: 'public',
                approval_status: 'approved',
                // embedding column does not exist or is auto-generated
                structured_data: {
                    type: 'wanted',
                    status: 'open',
                    priority: body.priority || 'normal',
                    me_too_count: 0,
                    me_too_users: [],
                    view_count: 0,
                    favorites: [],
                    subscribers: [],
                    requester_id: userId
                }
            });

        if (error) throw error;

        return NextResponse.json({ success: true, id });
    } catch (error) {
        console.error('Error creating wanted:', error);
        return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const { id, action, userId } = body;

        if (!id || !action) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const { data: current, error: fetchError } = await supabase
            .from('knowledge_base')
            .select('structured_data')
            .eq('id', id)
            .single();

        if (fetchError || !current) throw fetchError || new Error('Not found');

        let structured_data = current.structured_data;
        if (typeof structured_data === 'string') {
            try { structured_data = JSON.parse(structured_data); } catch (e) { }
        }
        structured_data = structured_data || {};

        let updates = {};

        if (action === 'me_too') {
            const users = structured_data.me_too_users || [];
            if (!users.includes(userId)) {
                users.push(userId);
                updates = {
                    structured_data: {
                        ...structured_data,
                        me_too_count: (structured_data.me_too_count || 0) + 1,
                        me_too_users: users
                    }
                };
            }
        } else if (action === 'resolve') {
            updates = {
                structured_data: {
                    ...structured_data,
                    status: 'resolved',
                    resolved_at: new Date().toISOString(),
                    resolver_id: userId
                }
            };
        } else if (action === 'view') {
            updates = {
                structured_data: {
                    ...structured_data,
                    view_count: (structured_data.view_count || 0) + 1
                }
            };
        } else if (action === 'favorite') {
            const favs = structured_data.favorites || [];
            // Toggle
            const newFavs = favs.includes(userId)
                ? favs.filter((u: string) => u !== userId)
                : [...favs, userId];
            updates = {
                structured_data: { ...structured_data, favorites: newFavs }
            };
        } else if (action === 'subscribe') {
            const subs = structured_data.subscribers || [];
            // Toggle
            const newSubs = subs.includes(userId)
                ? subs.filter((u: string) => u !== userId)
                : [...subs, userId];
            updates = {
                structured_data: { ...structured_data, subscribers: newSubs }
            };
        }

        if (Object.keys(updates).length > 0) {
            const { error: updateError } = await supabase
                .from('knowledge_base')
                .update(updates)
                .eq('id', id);

            if (updateError) throw updateError;
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating wanted:', error);
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}
