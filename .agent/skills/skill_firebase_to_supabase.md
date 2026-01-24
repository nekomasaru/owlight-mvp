# Skill: Firebase to Supabase Migration Strategy

**Skill ID**: migrate_firebase_to_supabase  
**Category**: Infrastructure Migration  
**Created**: 2026-01-24  
**Status**: Production Ready  

---

## Overview

This skill guides the systematic migration of Firebase-based applications to Supabase (PostgreSQL) + managed cloud services (Vertex AI Search, Gemini) while maintaining backward compatibility and minimizing operational risk.

**Use Case**: OWLight project migration from Firebase/File Search to Supabase/Vertex AI Search architecture.

---

## Key Principles

1. **Interface-First Design**: Never delete Firebase code immediately. Create abstractions (IRagService, ILlmService, IKnowledgeRepository) alongside existing implementations.

2. **Layered Migration**: 
   - Phase 1: Account & schema preparation
   - Phase 2: Interface definition & abstraction layer
   - Phase 3: Implementation creation (concrete adapters)
   - Phase 4: Integration testing
   - Phase 5: Firebase decommission (optional)

3. **Risk Mitigation**:
   - Each step requires explicit approval ("Wait for approval")
   - One-file-at-a-time refactoring for Phase 3 UI layer changes
   - Comprehensive integration tests before deletion

---

## Step-by-Step Instructions

### Step 0: Current State Analysis

**Prompt to Antigravity:**
```
Scan the codebase and list all files that directly import or use:
- Firebase SDK (firebase-admin, @firebase/*, etc.)
- File Search or any direct document search implementations
- Authentication logic tied to Firebase Auth
- Database queries tied to Firestore

Output a markdown table with:
- File path
- Import statement or usage pattern
- Purpose (e.g., 'user auth', 'knowledge log save', 'RAG search')

Wait for my review before proceeding to next step.
```

**Expected Output Format**:
```
| File Path | Import/Usage | Purpose |
|-----------|--------------|---------|
| src/services/auth.ts | import { initializeApp } from 'firebase/app' | User authentication |
| src/services/knowledge.ts | firestore.collection('knowledge_logs').add() | Knowledge save |
```

---

### Step 1: Infrastructure Setup

#### 1-1. Supabase Project Creation
- Navigate to supabase.com
- Create new project with:
  - **Region**: Asia Pacific (Tokyo) - ap-northeast-1
  - **Password**: 12+ characters, mixed case & symbols
- Record:
  - Project URL: `https://xxxxx.supabase.co`
  - `anon key` (client-side)
  - `service_role key` (backend, confidential)

#### 1-2. Database Schema Initialization

**SQL to execute in Supabase SQL Editor**:
```sql
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "vector";

create table if not exists knowledge_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  decision_type text not null,
  title text,
  summary text,
  structured_data jsonb,
  embedding vector(1536),
  is_published boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table knowledge_logs enable row level security;

create policy "select_own_or_published"
on knowledge_logs for select to authenticated
using (auth.uid() = user_id or is_published = true);

create policy "insert_own_logs"
on knowledge_logs for insert to authenticated
with check (auth.uid() = user_id);

create policy "update_own_logs"
on knowledge_logs for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

#### 1-3. Firebase Data Migration

**Using Supabase Community Tool**:
```bash
git clone https://github.com/supabase-community/firebase-to-supabase.git
cd firebase-to-supabase/firestore

# Export Firebase data
firestore-export --input firestore-creds.json --output firestore-backup.json

# Convert to Supabase format
node firestore2json.js --input firestore-backup.json --output supabase-import.json

# Import to Supabase
psql -h xxxxx.supabase.co -U postgres -d postgres \
  -c "COPY knowledge_logs FROM STDIN JSON" < supabase-import.json
```

#### 1-4. GCP + Vertex AI Search Setup

```bash
# Create GCP project
gcloud projects create owlight-dev --name="OWLight Development"
gcloud config set project owlight-dev

# Enable Vertex AI Search API
gcloud services enable discoveryengine.googleapis.com

# Create service account
gcloud iam service-accounts create owlight-backend \
  --display-name="OWLight Backend Service"

# Assign roles
gcloud projects add-iam-policy-binding owlight-dev \
  --member="serviceAccount:owlight-backend@owlight-dev.iam.gserviceaccount.com" \
  --role="roles/discoveryengine.admin"

# Create key
gcloud iam service-accounts keys create owlight-backend-key.json \
  --iam-account=owlight-backend@owlight-dev.iam.gserviceaccount.com

# Create Cloud Storage bucket
gsutil mb -p owlight-dev -l asia-northeast1 gs://owlight-manuals
gsutil -m cp -r ./manuals/* gs://owlight-manuals/
```

---

### Step 2: Architecture Communication

**Prompt to Antigravity:**
```
We are refactoring OWLight to use a layered architecture for:
1. Future migration to LGWAN/on-prem without rewriting UI or business logic
2. Technology independence (swap implementations without changing applications)

CURRENT STACK (to be replaced):
- Firebase Firestore → Supabase PostgreSQL
- Firebase Auth → Supabase Auth
- Custom File Search → Vertex AI Search API (Discovery Engine v1beta)

TARGET ARCHITECTURE:
- All business logic uses TypeScript interfaces (src/domain/interfaces/)
- Infrastructure implementations in src/infrastructure/
- UI and application layers depend ONLY on interfaces, never on SDK directly
- Dependency Injection container (src/di/container.ts) wires concrete classes

MIGRATION STRATEGY:
- Do NOT delete Firebase code yet
- Create new abstractions and implementations ALONGSIDE existing code
- Swap DI container bindings only after full testing
- Maintain backward compatibility until all tests pass

Acknowledge this plan and wait for step-by-step instructions.
```

---

### Step 3: Interface Definition

**Prompt to Antigravity:**
```
Create TypeScript interfaces under src/domain/interfaces/:

FILE 1: src/domain/interfaces/types.ts
[Include all domain types: ChatMessage, SearchResult, KnowledgeSchema, etc.]

FILE 2: src/domain/interfaces/IRagService.ts
[Define search interface]

FILE 3: src/domain/interfaces/ILlmService.ts
[Define generation & knowledge distillation interface]

FILE 4: src/domain/interfaces/IKnowledgeRepository.ts
[Define data persistence interface]

Keep these files minimal and framework-agnostic.
No imports of Firebase, Supabase, or any SDK.

Wait for my review before proceeding.
```

---

### Step 4-7: Implementation & UI Refactoring

Follow the pattern:
1. Create concrete implementations (SupabaseKnowledgeRepository, VertexAiSearchService, GeminiLlmService)
2. Build DI container
3. Refactor UI layer file-by-file with explicit diff review
4. Each file change requires "OK, proceed" approval before next file

---

### Step 8-10: Environment, Testing, Cleanup

- Set `.env.local` with Supabase + GCP credentials
- Run integration tests
- Delete Firebase code only after tests pass

---

## Antigravity Safety Guidelines

### Real Risks & Mitigations

| Risk | Manifestation | Mitigation |
|------|---------------|-----------|
| **Code Generation Errors** | Incorrect SQL, deadlocks in multi-table sync | Test in dev environment, staged rollout |
| **Multi-file Corruption** | Unintended changes across multiple files | One-file-at-a-time refactoring, diff review |
| **Context Loss** | Token depletion, forgotten instructions | Task decomposition, explicit "Wait for approval" |

### Best Practices

✅ Set explicit "Wait for approval" before each major step  
✅ Request diffs for all code changes  
✅ Verify changes in one file before proceeding  
✅ Maintain Firebase code until 100% test coverage  
✅ Use environment variables for all secrets  

---

## Verification Checklist

- [ ] Supabase project created with correct schema
- [ ] Firebase data migrated to Supabase (row counts verified)
- [ ] GCP project + Vertex AI Search datastore configured
- [ ] Service account key secured in environment
- [ ] Interfaces defined (4 files, zero SDK imports)
- [ ] Concrete implementations created & tested
- [ ] DI container wired and validated
- [ ] UI refactored file-by-file with approval
- [ ] Integration tests passing (100% coverage)
- [ ] Firebase code decommissioned

---

## Common Pitfalls & Solutions

| Issue | Root Cause | Solution |
|-------|-----------|----------|
| Vertex AI Search 404 | Wrong Datastore ID | Verify exact ID in GCP Console |
| Supabase RLS Error | Missing auth context | Authenticate user before DB query |
| JSON generation fails (Gemini) | No JSON Mode support | Implement 3x retry with clear prompt |
| Migration data mismatch | Schema incompatibility | Validate row counts pre/post-migration |

---

## References

- Supabase Migration Guide: https://supabase.com/docs/guides/platform/migrating-to-supabase/firestore-data
- Vertex AI Search API: https://docs.cloud.google.com/generative-ai-app-builder/docs/reference/rest
- Firebase Admin SDK: https://firebase.google.com/docs/database/admin/start
