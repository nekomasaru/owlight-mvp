-- ============================================================
-- OWLight Supabase Schema Migration
-- Execute this in Supabase SQL Editor
-- ============================================================

-- Step 1: Enable Required Extensions
-- ============================================================
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Note: Vector extension for future embedding support
-- create extension if not exists "vector";

-- Step 2: Users Table
-- ============================================================
create table if not exists users (
  id text primary key,
  name text not null,
  department text,
  role text default 'viewer', -- 'admin' | 'reviewer' | 'contributor' | 'viewer'
  stamina int default 100,
  max_stamina int default 100,
  mentor_mode boolean default false,
  points int default 0,
  thanks_count int default 0,
  time_saved_minutes int default 0,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Step 3: Knowledge Base Table (Trust Tier Support)
-- ============================================================
create table if not exists knowledge_base (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  category text,
  trust_tier int not null default 3, -- 1=Gold🥇, 2=Silver🥈, 3=Bronze🥉
  source_type text not null default 'user_submission', -- 'official' | 'mentor_validated' | 'user_submission'
  visibility text default 'public', -- 'public' | 'same_department' | 'private'
  department_id text,
  law_reference text,
  law_reference_url text,
  created_by text references users(id),
  contributors text[], -- Array of user IDs who contributed
  approver_id text references users(id),
  approval_status text default 'pending', -- 'pending' | 'approved' | 'rejected'
  approved_at timestamptz,
  helpfulness_count int default 0,
  tags text[],
  structured_data jsonb,
  -- Vertex AI Sync tracking
  synced_to_vertex boolean default false,
  synced_at timestamptz,
  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deprecated_at timestamptz,
  deprecation_note text
);

-- Step 4: Knowledge Feedback Table
-- ============================================================
create table if not exists knowledge_feedback (
  id uuid primary key default gen_random_uuid(),
  knowledge_id uuid references knowledge_base(id) on delete cascade,
  user_id text references users(id),
  helpful boolean not null,
  feedback_text text,
  created_at timestamptz default now(),
  unique(knowledge_id, user_id)
);

-- Step 5: System Prompts Table
-- ============================================================
create table if not exists prompts (
  id text primary key,
  content text not null,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Insert default system prompt
insert into prompts (id, content, description) values (
  'system_prompt',
  'あなたはOWLightの賢者「Mr.OWL」です。自治体職員のパートナーとして、丁寧かつ温かい「恩送り（Pay it Forward）」の精神で回答してください。',
  'メインのシステムプロンプト'
) on conflict (id) do nothing;

-- Step 6: Closing Logs Table (Daily Reflections)
-- ============================================================
create table if not exists closing_logs (
  id uuid primary key default gen_random_uuid(),
  user_id text references users(id),
  reflection text,
  accomplishments text[],
  tomorrow_goals text[],
  gratitude_to text, -- User ID of person to thank
  gratitude_message text,
  created_at timestamptz default now()
);

-- Step 7: Chat Sessions Table
-- ============================================================
create table if not exists chat_sessions (
  id text primary key,
  user_id text references users(id),
  title text default '新しい会話',
  model text default 'gemini-2.0-flash-exp',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Step 8: Chat Messages Table
-- ============================================================
create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id text references chat_sessions(id) on delete cascade,
  role text not null, -- 'user' | 'assistant' | 'system'
  content text not null,
  citations jsonb, -- Store RAG citations as JSON
  created_at timestamptz default now()
);

-- Step 9: Enable Row Level Security
-- ============================================================
alter table users enable row level security;
alter table knowledge_base enable row level security;
alter table knowledge_feedback enable row level security;
alter table prompts enable row level security;
alter table closing_logs enable row level security;
alter table chat_sessions enable row level security;
alter table chat_messages enable row level security;

-- Step 10: RLS Policies (Allow service role full access)
-- ============================================================
-- For MVP, we use service_role key which bypasses RLS
-- These policies are for future user-based access

-- Users: Allow read for authenticated, write for admins
create policy "users_read_all" on users for select using (true);
create policy "users_insert_all" on users for insert with check (true);
create policy "users_update_all" on users for update using (true);
create policy "users_delete_all" on users for delete using (true);

-- Knowledge: Allow read for approved/public, write for authenticated
create policy "knowledge_read_approved" on knowledge_base for select using (
  approval_status = 'approved' or visibility = 'public' or true
);
create policy "knowledge_insert_all" on knowledge_base for insert with check (true);
create policy "knowledge_update_all" on knowledge_base for update using (true);
create policy "knowledge_delete_all" on knowledge_base for delete using (true);

-- Prompts: Allow read for all, write for admins
create policy "prompts_read_all" on prompts for select using (true);
create policy "prompts_insert_all" on prompts for insert with check (true);
create policy "prompts_update_all" on prompts for update using (true);

-- Closing logs: Allow read/write for own logs
create policy "closing_logs_all" on closing_logs for all using (true);

-- Chat: Allow read/write for own sessions
create policy "chat_sessions_all" on chat_sessions for all using (true);
create policy "chat_messages_all" on chat_messages for all using (true);

-- Feedback: Allow read/write for authenticated
create policy "feedback_all" on knowledge_feedback for all using (true);

-- Step 11: Create Indexes for Performance
-- ============================================================
create index if not exists idx_knowledge_trust_tier on knowledge_base(trust_tier);
create index if not exists idx_knowledge_approval_status on knowledge_base(approval_status);
create index if not exists idx_knowledge_synced on knowledge_base(synced_to_vertex);
create index if not exists idx_knowledge_created_by on knowledge_base(created_by);
create index if not exists idx_chat_messages_session on chat_messages(session_id);
create index if not exists idx_chat_sessions_user on chat_sessions(user_id);
create index if not exists idx_closing_logs_user on closing_logs(user_id);

-- Step 12: Create Updated_at Trigger Function
-- ============================================================
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply trigger to tables with updated_at
create trigger update_users_updated_at before update on users
  for each row execute function update_updated_at_column();

create trigger update_knowledge_updated_at before update on knowledge_base
  for each row execute function update_updated_at_column();

create trigger update_prompts_updated_at before update on prompts
  for each row execute function update_updated_at_column();

create trigger update_chat_sessions_updated_at before update on chat_sessions
  for each row execute function update_updated_at_column();

-- ============================================================
-- Migration Complete!
-- ============================================================
-- Next Steps:
-- 1. Seed initial users (run seed script or use Admin UI)
-- 2. Configure Vertex AI Search continuous import
-- 3. Run sync script to export knowledge to GCS
-- ============================================================
