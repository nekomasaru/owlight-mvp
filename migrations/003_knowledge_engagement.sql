-- Migration: Add Knowledge Engagement Features

-- 1. Add View Count to knowledge_base
alter table knowledge_base add column if not exists view_count int default 0;

-- 2. Create favorites table
create table if not exists knowledge_favorites (
    user_id text not null references users(id) on delete cascade,
    knowledge_id uuid not null references knowledge_base(id) on delete cascade,
    created_at timestamptz default now(),
    primary key (user_id, knowledge_id)
);

-- 3. Create notifications table
create table if not exists notifications (
    id uuid primary key default gen_random_uuid(),
    user_id text not null references users(id) on delete cascade,
    type text not null, -- 'system', 'approval', 'knowledge_update', etc.
    title text not null,
    body text,
    link_url text,
    is_read boolean default false,
    created_at timestamptz default now()
);

-- 4. Enable RLS
alter table knowledge_favorites enable row level security;
alter table notifications enable row level security;

-- 5. Basic Policies (Allow all for service_role/MVP simplicity, same as others)
create policy "favorites_all" on knowledge_favorites for all using (true);
create policy "notifications_all" on notifications for all using (true);

-- Indexes
create index if not exists idx_notifications_user on notifications(user_id);
create index if not exists idx_favorites_user on knowledge_favorites(user_id);
create index if not exists idx_favorites_knowledge on knowledge_favorites(knowledge_id);
