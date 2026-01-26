# Skill: Knowledge Architecture for Administrative Organizations

**Skill ID**: knowledge_architecture_admin  
**Category**: Knowledge Management / Information Architecture  
**Created**: 2026-01-24  
**Status**: Production Ready  

---

## Overview

This skill designs knowledge infrastructure for administrative organizations where **tacit knowledge (experience, intuition, workarounds) is systematically captured and transformed into organizational intelligence.**

The core insight: Traditional KM systems fail because they demand *explicit codification* from busy practitioners. OWLight reverses the burden by capturing knowledge automatically and only requiring *curation*, not creation.

---

## The Problem: The Tacit Knowledge Cliff

### Scenario
A city hall social services section loses three senior caseworkers to retirement in one year. The new cohort takes 6 months to reach productivity. The organization "learns" nothing. Every 3 years, the cycle repeats.

**Why?**
- Senior knowledge exists only in their heads (implicit)
- Training manuals are out-of-date (written 5 years ago)
- Workarounds discovered through trial-and-error are reinvented each generation
- **Institutional memory has a 3-year expiration date**

---

## The Solution: The Forest Ecosystem (Automatic Capture → AI Distillation → RDB Storage)

### Architecture Layer 1: Automatic Capture (No User Action Required)

**Principle**: Turn the drudgery of documentation into effortless intelligence.

#### 1-1. Opt-Out Posting (Exploit Default Bias)

**Design**:
```
When staff member resolves an issue via AI search + follow-up Q&A:

System action (3 days later):
├─ AI automatically creates knowledge entry from chat transcript
├─ Entry tagged: Category, Date, Difficulty Level, Staff member name
├─ Entry marked: "Will be published on Day 4 unless you object"
└─ Email to staff member: "Here's what we learned from your help request"

Staff choice:
├─ "Great, thanks" → Knowledge published automatically
├─ "Wait, I need to check with supervisor" → 2-week hold
├─ "This has sensitive info" → Deleted, never published
└─ (no action = auto-publish)
```

**Behavioral Logic**:
- **Default bias**: Most people don't bother to opt-out
- **Lazy compliance**: Knowledge accumulates as byproduct of work, not as added task
- **Dignity preserved**: Staff can object without friction

#### 1-2. Tributary Input Model (Let the Helped Person Document)

**Design**:
```
Scenario: 係長 A helps 新人 B with a complex insurance calculation.

Traditional (fails): "係長 A, can you write this up in the manual?"
→ 係長 has zero time; nobody documents anything

OWLight model: After B successfully submits the claim:
├─ B sees prompt: "係長 A はあなたを手伝いました。その智慧をナレッジにしますか？"
├─ B spends 2 minutes drafting: "係長 Aから学んだこと：支度金の計算は【手順】"
├─ System publishes under: "B's experience" but credits "A's contribution"
└─ 係長 A automatically gets: Status point, "Mentor" badge, Recovery of Karma Stamina

Result:
✓ Knowledge captured (done by person who just learned, while fresh in mind)
✓ 係長 A honored without extra work
✓ B gets writing practice and connection to mentor
✓ Organization gains asset
```

**Behavioral Logic**:
- Shift writing burden from expert (scarce) to learner (abundant)
- Learner's documentation is often *better* (recent memory, beginner's mind)
- Creates implicit mentor-mentee relationship (governance without forcing it)

---

### Architecture Layer 2: Knowledge Processing (Gemini 2.5 Flash)

Once raw knowledge is captured, AI transforms it into structured, reusable assets.
> **Note**: This process happens *before* storage (Knowledge Creation phase). For real-time retrieval (RAG), OWLight uses Vertex AI Search, not Gemini manual RAG. Gemini is used here strictly for formatting and structuring unstructured inputs into JSON.

#### 2-1. Knowledge Synthesis

**Input**: Raw Q&A transcript or user-drafted note

**AI Process**:
```
Input: "係長が言ってくれたのは、要するに...計算の順序が大事で、
先に手当額を出してから、控除額を差し引く。でも、扶養者がいる場合は
別ルール。あ、でも、基本手当がない場合は...うーん、複雑ですね。"

Gemini processes:
1. Extract key decision points (順序, 扶養者, 基本手当)
2. Infer implicit rules (if-then-else logic)
3. Identify edge cases (扶養者なし, 基本手当ゼロ)
4. Generate flowchart
5. Suggest Tier 1 (Gold) validation: "This rule should be reviewed by課長"

Output JSON:
{
  "title": "生活保護給付金の計算フロー（扶養者あり/なし）",
  "category": "保健福祉",
  "flowchart": "graph TD; ... (Mermaid format)",
  "rules": [
    { "condition": "扶養者あり", "action": "別紙様式Aを適用", "source": "生保法施行令3条" },
    { "condition": "基本手当ゼロ", "action": "最低保障額を適用", "validation_tier": "Gold" }
  ],
  "edge_cases": ["扶養者の定義", "パート収入の扱い"],
  "trust_score": 0.78,
  "validation_status": "pending_review"
}
```

**Behavioral Logic**:
- AI makes implicit knowledge explicit (flowcharts, decision trees)
- Identifies ambiguity (edge cases) automatically
- Flags uncertain rules for human review (Tier 1 validation)

#### 2-2. Tiered Authority (Trust Badges)

Knowledge entries are labeled by trustworthiness:

| Tier | Badge | Criteria | Validation Path |
|------|-------|----------|-----------------|
| **Tier 1 (Gold)** | 🥇 | Approved by department head + legal review + law reference | Published official procedure |
| **Tier 2 (Silver)** | 🥈 | Approved by senior staff (10+ years) + AI confidence score >0.85 | Mentor-validated workaround |
| **Tier 3 (Bronze)** | 🥉 | Raw user submission, unvalidated | "One person found this helpful" |

**Design**:
```
User searches "扶養者計算方法":

Result 1 (Gold 🥇): "生活保護給付の扶養者判定基準"
├─ Source: 生活保護法施行令第5条
├─ Approved by: 福祉事務所長（課長決裁2024-11-15）
├─ Confidence: 100%
└─ → Use this for official determination

Result 2 (Silver 🥈): "複雑なケースへの対応（係長の経験談）"
├─ Approved by: 係長 佐藤（20年経験）
├─ Confidence: 85%
└─ → Use this for reasoning; validate against Result 1

Result 3 (Bronze 🥉): "扶養者がいるときの計算"
├─ Posted by: 新人職員 田中
├─ Confidence: 45%
└─ ⚠️ Check against Gold/Silver before trusting
```

**Anti-Hallucination Strategy**:
- Tier 1 always pinned to official law/regulation (never AI-generated only)
- Tier 2 must have human sponsor (senior staff member)
- Tier 3 explicitly flagged as "not yet validated"
- **No result should appear without visible trust badge**

---

### Architecture Layer 3: RDB Storage (Supabase PostgreSQL)

Knowledge is stored in relational database with RLS for access control.

#### 3-1. Schema Design

```sql
create table knowledge_base (
  id uuid primary key,
  category text,  -- '保健福祉', '危機管理', etc
  title text,
  content jsonb,  -- Distilled content from AI
  source_type text,  -- 'official' | 'mentor_validated' | 'user_submission'
  trust_tier int,  -- 1=Gold, 2=Silver, 3=Bronze
  law_reference text,  -- '生保法第10条' if applicable
  created_by uuid references auth.users,
  created_at timestamptz,
  updated_at timestamptz,
  deprecation_notice text  -- If superseded by newer knowledge
);

create table knowledge_access_log (
  id uuid primary key,
  knowledge_id uuid references knowledge_base,
  user_id uuid references auth.users,
  search_query text,
  helped boolean,  -- Did this result actually help solve the problem?
  timestamp timestamptz
);

create table knowledge_lineage (
  id uuid primary key,
  knowledge_id uuid references knowledge_base,
  derived_from uuid references knowledge_base,  -- Traceability
  transformation text,  -- 'AI synthesis', 'expert review', etc
  timestamp timestamptz
);
```

#### 3-2. RLS Policies

```sql
-- Knowledge visibility depends on tier & sensitivity
create policy "knowledge_access_by_tier"
on knowledge_base for select to authenticated
using (
  trust_tier = 1  -- Gold always visible
  or (trust_tier = 2 and user_department = creator_department)  -- Silver: same dept
  or (trust_tier = 3 and user_id = creator)  -- Bronze: creator only
);

-- Only department heads can publish Gold-tier
create policy "gold_tier_creation"
on knowledge_base for insert to authenticated
with check (
  trust_tier = 1 implies auth.jwt_claims()->'role' = 'department_head'
);
```

---

## Knowledge Lifecycle Management

### The Decay & Refresh Cycle

Knowledge doesn't stay fresh indefinitely. Administrative rules change, interpretations evolve.

**Design**:
```
Timeline:

Day 0: Knowledge created + AI processing + Tier assigned
  └─ Trigger: First use generates confidence baseline

Month 1-6: Active usage phase
  └─ Each search/reference adds to "helpfulness score"
  └─ If helpfulness trend = flat → flag for potential deprecation

Month 6: Review trigger
  └─ If not used in 6 months: "Is this still relevant?"
  └─ Author + department head review
  └─ Options:
     a) "Still good" → refresh timestamp, trigger update search
     b) "Needs revision" → task assigned to senior staff
     c) "Obsolete" → mark deprecation, link to replacement

Year 1+: Continuous governance
  └─ If Gold-tier knowledge: Annual review by department head (required)
  └─ If Silver/Bronze: Auto-archive if not accessed in 2 years
```

**Behavioral Logic**:
- Knowledge doesn't accumulate forever (no "knowledge landfill")
- Active maintenance prevents "technical debt" in institutional memory
- Clear ownership (author, reviewer) creates accountability

---

## The 5:15:80 Rule Applied to Knowledge Contribution

### Realistic Participation Model

```
Top 5% (The Creators - "神")
├─ Post 5+ new knowledge entries monthly
├─ Review/curate others' submissions
├─ Serve as Tier 1 validators
└─ Get: Status, Relief from AI search (Karma Stamina recovery)

Middle 15% (The Supporters)
├─ Post occasional entries (1-2 monthly)
├─ Provide feedback/corrections ("Helpful? Yes/No")
├─ Answer Q&A when summoned
└─ Get: Recognition in "Contributor" section

Bottom 80% (The Learners)
├─ Search, read, apply knowledge
├─ Submit issues ("This doesn't work for X case")
├─ Provide "helpful" feedback
└─ No posting required; knowledge consumption IS the value
```

**Incentive Structure**:
```
Top 5% motivation: 
  ✓ "Without my contributions, others would be lost"
  ✓ Visible Status (Featured in Weekly Digest)
  ✓ Karma Stamina relief (can search own work without cost)
  ✓ First consideration for promotion/special assignment

Middle 15% motivation:
  ✓ "My idea was helpful to others"
  ✓ Modest recognition (Badge on profile)
  ✓ Feeling of contribution without heavy lift

Bottom 80% motivation:
  ✓ "I'm not alone; others faced this too"
  ✓ "I can find answers faster than asking"
  ✓ Implicit permission to learn at own pace
```

**Critical**: Never shame the 80%. Never say "why aren't you contributing?" The value chain is:

**Creators generate** → **Curators validate** → **Learners apply** → **Success creates new Creators**

---

## Measurement & Feedback Loops

### Key Metrics

| Metric | Healthy Signal | Red Flag |
|--------|---|---|
| **Knowledge Growth Rate** | 50-100 new entries/month | <10/month (not capturing) |
| **Tier 1 Ratio** | >40% of knowledge (mature org) | <20% (too much unvalidated) |
| **Helpfulness Score** | >70% "helpful" ratings | <50% (knowledge quality issue) |
| **Age Distribution** | 30% <1mo, 30% 1-6mo, 40% >6mo | All >1 year (stale) |
| **Creator Churn** | <5% top 5% turnover | >15% (losing keepers) |
| **Search-to-Resolution** | <3 searches to solve problem | >7 searches (fragmented knowledge) |

### Feedback Loop: Usage → AI Refinement

```
Week 1: Staff searches "給与計算 基本手当"
        ↓
Result: Silver-tier entry displayed
        ↓
Staff: "This helped" → Logs success

Week 2-4: AI aggregates usage data
          ├─ This entry gets 95% "helpful" rating
          ├─ Analysis: No edge case issues reported
          ├─ Recommendation: Promote from Silver to Gold?
          └─ Task: "Have department head approve law reference"

Week 5: Department head reviews & approves
        ↓
Entry upgraded to Gold (🥇)
        ↓
Next search gets higher priority result
```

---

## Anti-Patterns to Avoid

❌ **"Mandatory Knowledge Sharing"**
- Rule: "Everyone must post 1 entry per quarter"
- Result: Garbage in, garbage out; resentment
- Instead: Celebrate Top 5%, don't shame others

❌ **"One Canonical Source of Truth"**
- Lock people into single manual → kills adaptation
- Instead: Tiered system where Silver/Bronze reflect "how people actually work"

❌ **"Search Replaces Human Contact"**
- Thinking: "AI answers everything, no need for mentors"
- Result: New staff feels abandoned
- Instead: Use search as **bridge to human mentorship**

❌ **"Permanent Knowledge"**
- Treating 3-year-old entries as gospel
- Instead: Explicit review cycles, deprecation, refresh

---

## Verification Checklist

- [ ] Schema supports all 3 trust tiers (Gold/Silver/Bronze)
- [ ] Opt-out posting implemented (automatic capture + 3-day window)
- [ ] Tributary model enables junior staff to document
- [ ] RLS policies prevent unauthorized access
- [ ] AI distillation (Gemini) generates structured outputs (JSON flowcharts)
- [ ] Helpfulness feedback loop (Yes/No rating on search results)
- [ ] Decay management (6-month review, archival policy)
- [ ] Metrics dashboard (entry growth, tier distribution, helpfulness trends)
- [ ] Top 5% identified & incentivized
- [ ] No mandatory posting rules

---

## Phase Roadmap

| Phase | Timeline | Goals |
|-------|----------|-------|
| **Phase 1 (MVP)** | Month 1-3 | Capture knowledge automatically; achieve 200+ entries; establish Tier 1 validation |
| **Phase 2** | Month 4-12 | Deploy Tributary model; promote top 5%; build helpfulness feedback loop |
| **Phase 3 (LGWAN)** | Year 2+ | Decay management; cross-organization sharing (with RLS); integration with job training |

---

## References

- Peter Drucker: *The Knowledge Worker* (concept of tacit knowledge)
- Michael Polanyi: *The Tacit Dimension* (implicit vs. explicit knowledge)
- Nonaka & Takeuchi: *The Knowledge-Creating Company* (SECI model)
- Donovan Siroker & Pete Koomen: *A/B Testing* (empirical validation)
