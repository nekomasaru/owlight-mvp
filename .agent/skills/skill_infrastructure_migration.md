# Skill: OWLight Infrastructure Migration (Vertex-Managed RAG)

**Skill ID**: `owlight_infrastructure_migration`  
**Category**: Infrastructure Migration  
**Created**: 2026-01-26 (Consolidated)  
**Status**: Production Ready  
**Supersedes**: `migrate_firebase_to_supabase`, `migrate_firebase_to_supabase_v2`

---

## Overview

This skill guides the systematic migration of OWLight from Firebase to a **Vertex-Managed RAG architecture** where:

- **Supabase PostgreSQL**: Stores user data, profiles, knowledge metadata, approval workflows
- **GCS + Vertex AI Search**: Stores and indexes all searchable content (manuals + employee knowledge)
- **Vertex AI handles all RAG logic**: Search ranking, grounding, answer generation

**Core Principle**: Minimize application-side RAG complexity by delegating search/merge/ranking to Vertex AI Search, which can be tuned via GCP Console without code changes.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Supabase (PostgreSQL)                      │
│  ├── users: プロファイル、ロール、スタミナ、ポイント            │
│  ├── knowledge_base: メタデータ（Trust Tier、承認状態、作成者）│
│  ├── knowledge_approvals: 承認ワークフロー                      │
│  ├── prompts: システムプロンプト管理                            │
│  └── closing_logs: 日報・振り返り                               │
└─────────────────────────┬───────────────────────────────────────┘
                          │ (Sync Script - 5min interval)
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    GCS Bucket (owlight)                         │
│  ├── /manuals/: 公式マニュアル (.pdf, .docx)                    │
│  └── /knowledge/: 同期されたナレッジ (.json with metadata)      │
│       └── Format: { title, content, trust_tier, author, ... }   │
└─────────────────────────┬───────────────────────────────────────┘
                          │ (Auto-import by Vertex)
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│              Vertex AI Search (owlight-search)                  │
│  ├── Datastore: owlight-datastore (linked to GCS bucket)        │
│  ├── Search Config: Adjusted via GCP Console                    │
│  │     ├── Boosting rules (Trust Tier優先)                      │
│  │     ├── Filtering (部署別、承認済みのみ)                     │
│  │     └── Snippet extraction                                   │
│  └── Answer Generation: Grounded answer with citations          │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│        IRagService (VertexAiSearchService.ts)                   │
│  ├── search(query) → Vertex answer + citations                  │
│  └── Metadata extraction → Trust Tier badges for UI             │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Chat API (route.ts)                          │
│  ├── Receives Vertex answer + knowledge context                 │
│  ├── Adds mentor mode, stamina logic                            │
│  └── Streams response via Gemini LLM                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Benefits

| Aspect | Benefit |
|--------|---------|
| **RAG調整** | GCPコンソールで設定変更のみ（コード不要） |
| **マージロジック** | Vertex AIが自動で公式マニュアル+ナレッジを統合 |
| **スケーラビリティ** | ドキュメント追加はGCSにアップロードするだけ |
| **運用負荷** | 同期スクリプトのみ（5分間隔のCron） |
| **障害点** | 1つ（Vertex AIはマネージドサービス） |
| **Trust Tier表示** | ドキュメントメタデータから抽出してUIで表示 |

---

## Phase-by-Phase Implementation

### Phase 1: Supabase Schema Extension

Create Knowledge Architecture-aligned tables in Supabase.

**SQL to execute:**
```sql
-- Enable extensions
create extension if not exists "vector";
create extension if not exists "uuid-ossp";

-- Users table (migrate from Firebase)
create table if not exists users (
  id text primary key,
  name text not null,
  department text,
  role text default 'viewer',
  stamina int default 100,
  mentor_mode boolean default false,
  points int default 0,
  thanks_count int default 0,
  time_saved_minutes int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Knowledge base with Trust Tier support
create table if not exists knowledge_base (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  category text,
  trust_tier int not null default 3, -- 1=Gold, 2=Silver, 3=Bronze
  source_type text not null, -- 'official' | 'mentor_validated' | 'user_submission'
  visibility text default 'public', -- 'public' | 'same_department' | 'private'
  department_id text,
  law_reference text,
  law_reference_url text,
  created_by text references users(id),
  approver_id text references users(id),
  approval_status text default 'pending', -- 'pending' | 'approved' | 'rejected'
  approved_at timestamptz,
  helpfulness_count int default 0,
  tags text[],
  structured_data jsonb,
  synced_to_vertex boolean default false,
  synced_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- System prompts
create table if not exists prompts (
  id text primary key,
  content text not null,
  updated_at timestamptz default now()
);

-- Closing logs (daily reflections)
create table if not exists closing_logs (
  id uuid primary key default gen_random_uuid(),
  user_id text references users(id),
  content text,
  created_at timestamptz default now()
);

-- Chat history
create table if not exists chat_sessions (
  id text primary key,
  user_id text references users(id),
  title text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id text references chat_sessions(id) on delete cascade,
  role text not null, -- 'user' | 'assistant'
  content text not null,
  created_at timestamptz default now()
);

-- RLS Policies
alter table users enable row level security;
alter table knowledge_base enable row level security;

-- Allow service role full access (for backend)
create policy "service_role_all" on users for all using (true);
create policy "service_role_all" on knowledge_base for all using (true);
```

---

### Phase 2: Knowledge Sync Script

Create script to export approved knowledge from Supabase to GCS.

**File: `scripts/sync-knowledge-to-gcs.ts`**
```typescript
import { createClient } from '@supabase/supabase-js';
import { Storage } from '@google-cloud/storage';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const storage = new Storage({ keyFilename: './gcp-key.json' });
const bucket = storage.bucket('owlight');

async function syncKnowledgeToGCS() {
  // Fetch approved knowledge that needs syncing
  const { data: knowledge, error } = await supabase
    .from('knowledge_base')
    .select('*')
    .eq('approval_status', 'approved')
    .or('synced_to_vertex.is.null,synced_to_vertex.eq.false');

  if (error) throw error;
  if (!knowledge?.length) {
    console.log('No new knowledge to sync');
    return;
  }

  for (const item of knowledge) {
    // Create document with metadata for Vertex
    const doc = {
      id: item.id,
      title: item.title,
      content: item.content,
      // Metadata fields (searchable in Vertex)
      trust_tier: item.trust_tier,
      trust_tier_label: item.trust_tier === 1 ? 'Gold' : item.trust_tier === 2 ? 'Silver' : 'Bronze',
      source_type: item.source_type,
      category: item.category,
      author_id: item.created_by,
      law_reference: item.law_reference,
      tags: item.tags?.join(', '),
      created_at: item.created_at
    };

    const filename = `knowledge/${item.id}.json`;
    await bucket.file(filename).save(JSON.stringify(doc, null, 2), {
      contentType: 'application/json'
    });

    // Mark as synced
    await supabase
      .from('knowledge_base')
      .update({ synced_to_vertex: true, synced_at: new Date().toISOString() })
      .eq('id', item.id);

    console.log(`Synced: ${item.title}`);
  }

  console.log(`Synced ${knowledge.length} knowledge items to GCS`);
}

syncKnowledgeToGCS().catch(console.error);
```

**Run via Cron (every 5 minutes):**
```bash
# Add to crontab or use Cloud Scheduler
*/5 * * * * cd /path/to/owlight-mvp && npx tsx scripts/sync-knowledge-to-gcs.ts
```

---

### Phase 3: Vertex AI Search Configuration

Configure Vertex AI Search via GCP Console to:

1. **Re-import** after sync (or use continuous import)
2. **Boosting**: Prioritize `trust_tier=1` (Gold) documents
3. **Filtering**: Allow filtering by `trust_tier`, `category`, `department_id`

**Console Steps:**
1. Navigate to Vertex AI Search > owlight-search > Data Stores
2. Enable "Continuous import" for GCS bucket
3. Configure search boosting in the Search App settings

---

### Phase 4: Interface & Repository Updates

#### 4-1: Update `IKnowledgeRepository`
```typescript
export interface IKnowledgeRepository {
  // User management
  getUser(userId: string): Promise<User | null>;
  getAllUsers(): Promise<User[]>;
  saveUser(user: User): Promise<void>;
  deleteUser(userId: string): Promise<void>;

  // Knowledge CRUD
  saveKnowledge(record: KnowledgeRecord): Promise<string>;
  getKnowledge(id: string): Promise<KnowledgeRecord | null>;
  searchKnowledge(query: string, limit?: number): Promise<KnowledgeRecord[]>;
  approveKnowledge(id: string, approverId: string): Promise<void>;

  // Prompts
  getPrompt(id: string): Promise<string | null>;
  savePrompt(id: string, content: string): Promise<void>;

  // Chat history
  getChatSessions(userId: string): Promise<ChatSession[]>;
  saveChatMessage(sessionId: string, message: ChatMessage): Promise<void>;

  // Closing logs
  saveClosingLog(userId: string, content: string): Promise<void>;
}
```

#### 4-2: Implement `SupabaseKnowledgeRepository`
Implement all methods using Supabase client.

---

### Phase 5: UI Layer Migration

Migrate each file from Firebase to repository pattern:

| File | Current | Target |
|------|---------|--------|
| `app/page.tsx` | Firestore chat history | `knowledgeRepository.getChatSessions()` |
| `app/search/page.tsx` | Firestore knowledge query | `knowledgeRepository.searchKnowledge()` |
| `app/engagement/page.tsx` | Firestore user stats | `knowledgeRepository.getUser()` |
| `app/admin/users/page.tsx` | Firestore CRUD | `knowledgeRepository.*User()` |
| `app/api/prompts/route.ts` | Firestore prompts | `knowledgeRepository.*Prompt()` |
| `app/api/chat/route.ts` | Firestore prompt fetch | `knowledgeRepository.getPrompt()` |

---

### Phase 6: Firebase Cleanup

1. Remove `lib/firebase.ts`
2. Uninstall `firebase` package
3. Remove Firebase environment variables
4. Update `.gitignore` to exclude Firebase credentials

---

## Verification Checklist

- [ ] Supabase schema created with all tables
- [ ] Sync script working (knowledge → GCS)
- [ ] Vertex AI Search re-importing from GCS
- [ ] Trust Tier badges showing in UI
- [ ] All Firebase imports removed
- [ ] `npm run build` succeeds
- [ ] Chat, Search, Users, Engagement pages working

---

## Post-Launch Operations

| Task | Frequency | How |
|------|-----------|-----|
| RAG tuning | As needed | GCP Console (boosting, filtering) |
| Add manuals | As needed | Upload to GCS bucket |
| Review sync | Weekly | Check `synced_to_vertex` column |
| Database backup | Daily | Supabase automatic backups |

---

## References

- [Vertex AI Search Documentation](https://cloud.google.com/generative-ai-app-builder/docs)
- [Supabase PostgreSQL](https://supabase.com/docs/guides/database)
- [Knowledge Architecture Skill](./skill_knowledge_architecture.md) (design principles)
