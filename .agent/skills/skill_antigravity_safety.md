# Skill: Antigravity Safety Protocol for Large Codebases

**Skill ID**: antigravity_safety_protocol  
**Category**: AI Agent Management / Risk Mitigation  
**Created**: 2026-01-24  
**Status**: Production Ready  

---

## Overview

This skill provides **concrete guardrails and verification procedures** for using Antigravity (or any autonomous code generation AI agent) on large, mission-critical codebases. It is designed to prevent the most common failure modes while preserving the productivity benefits of AI-assisted refactoring.

**Why This Matters**: Antigravity is powerful—but without explicit safety protocols, it can introduce subtle bugs, corrupt existing code, or hallucinate entire implementations that *look* correct but fail in production.

---

## The Real Risks (Not Theoretical)

### Risk 1: Code Generation Hallucination

**Manifestation**: Antigravity generates syntactically correct but logically broken code.

**Example**:
```typescript
// You ask: "Generate a Supabase repository for knowledge_logs"
// Antigravity responds:

export class SupabaseKnowledgeRepository implements IKnowledgeRepository {
  async save(data: KnowledgeData): Promise<string> {
    const { data: result, error } = await supabase
      .from('knowledge_logs')
      .insert([{
        user_id: data.userId,
        decision_type: data.decisionType,
        // ❌ PROBLEM: Forgot to handle structured_data serialization
        structured_data: data.structuredData,  // Passed as-is, not JSON.stringify
        // ❌ PROBLEM: No error checking
      }]);
    
    return result[0].id;  // What if result is null/empty?
  }
}
```

**Red Flags**:
- No null checks on API responses
- Assumes success path only (no error handling)
- Missing data validation
- No logging for debugging

**Mitigation**:
- Always request **error handling + edge case commentary** in the prompt
- Ask Antigravity to explain assumptions: "List 5 things that could go wrong with this code"
- Code review by senior dev before merge

---

### Risk 2: Multi-File Corruption

**Manifestation**: Antigravity makes changes across multiple files, and subtle inconsistencies break the build.

**Example**:
```
Task: "Refactor authentication to use Supabase Auth"

Antigravity changes:
  ✓ File A: src/services/auth.ts → Uses Supabase Auth correctly
  ✓ File B: src/di/container.ts → Binds correct service
  ❌ File C: src/middleware/requireAuth.ts → Still uses old Firebase check
  ❌ File D: src/api/user.ts → Expects Firebase ID token format

Result: 
  - Code compiles
  - Tests pass (if they're not comprehensive)
  - Crashes at runtime: "Auth ID token format mismatch"
```

**Red Flags**:
- Globbing imports changed in one file but not another
- Type signatures that don't match between files
- Environment variable names changed inconsistently

**Mitigation**:
- **One file at a time** for risky refactoring (authentication, data models)
- Require diff review before each file change
- Explicit "Wait for approval" between files
- Run type checker after each file: `tsc --noEmit`

---

### Risk 3: Context Loss & Token Exhaustion

**Manifestation**: Antigravity forgets earlier instructions midway through a task.

**Example**:
```
T=0h: "Build an abstraction layer for RAG services. 
       CRITICAL: All implementations must handle null responses."

T=2h: (After 10 back-and-forth iterations)
      Antigravity: "Here's the VertexAiSearchService implementation"
      
      ✓ Correctly handles null response for IRagService
      ❌ But completely forgot: IKnowledgeRepository must also handle null
      ❌ And forgot the "wait for approval" instruction
      → Generates EmbeddingService and immediately tries to wire into DI container
         without waiting for your review
```

**Red Flags**:
- Antigravity proceeds without waiting for approval
- Contradicts earlier design decisions
- Suddenly switches coding style mid-task

**Mitigation**:
- **Repeat critical constraints** every 3-4 exchanges: "Remember: null safety is critical"
- Break tasks into explicit phases with clear phase transitions
- Request status summary: "Summarize what you've done so far and what's next"
- If task > 2 hours, take a 30-min break and restart conversation

---

### Risk 4: Database Schema Mismatches

**Manifestation**: Antigravity assumes incorrect column types or relationships.

**Example**:
```sql
-- Actual schema
CREATE TABLE knowledge_logs (
  id UUID PRIMARY KEY,
  embedding VECTOR(1536),  -- 1536 dimensions
  created_at TIMESTAMPTZ
);

-- Antigravity generates:
export class SupabaseKnowledgeRepository {
  async saveWithEmbedding(data: KnowledgeData, embedding: number[]): Promise<string> {
    // ❌ Assumes embedding is float8[] or real[]
    // ❌ Passes JS number[] directly
    // ❌ Doesn't convert to pgvector format
    await supabase
      .from('knowledge_logs')
      .insert([{ embedding: embedding }]);  // Type mismatch!
  }
}
```

**Red Flags**:
- Embedding handling without explicit pgvector import
- Date handling without timezone awareness
- UUID generation not using `gen_random_uuid()`

**Mitigation**:
- **Provide full SQL schema as context** in initial prompt
- Ask Antigravity to validate: "Does this TypeScript code match the SQL schema? List any mismatches."
- Always include type definitions from schema in the conversation

---

## The Four-Layer Safety Protocol

### Layer 1: Task Decomposition & Explicit Instruction

**Before calling Antigravity, answer these questions**:

1. **Can this task be broken into 2+ independent subtasks?**
   - ✅ Yes → Break it down. Antigravity works better with smaller scope.
   - ❌ No → Proceed, but add explicit checkpoints.

2. **What are the 3 biggest things that could go wrong?**
   - Hallucination: "Antigravity might forget error handling"
   - Inconsistency: "Antigravity might change imports in one file but not another"
   - Context loss: "Token exhaustion after multi-file changes"
   - **Include these in your prompt**: "CRITICAL RISKS: [list 3]"

3. **How will I verify this is correct?**
   - Unit test coverage?
   - Integration test?
   - Code review checklist?
   - Type checking (`tsc --noEmit`)?
   - Manual testing?
   - **Write verification spec BEFORE giving task to Antigravity**

---

### Layer 2: Prompt Engineering for Safety

**Template for Safe Antigravity Prompts**:

```
You are helping refactor OWLight (administrative platform).

CONTEXT:
[Provide full schema, type definitions, interface contracts]

TASK:
[Clear, single-goal task]

CRITICAL CONSTRAINTS:
1. All database operations must handle null/error responses
2. One file change at a time; wait for explicit approval between files
3. TypeScript types must match the schema provided
4. No assumptions about response format; test with actual data

ASSUMPTIONS YOU MUST VALIDATE:
- Is the Supabase table name correct? (knowledge_logs, not knowledge_log)
- Is the RLS policy already enabled? (Yes, with policy "select_own_or_published")
- Will this code work offline? (No, requires network; that's OK)

OUTPUT FORMAT:
1. Show the code
2. Highlight 2-3 assumptions
3. List potential failure modes
4. Ask 1-2 clarifying questions

CRITICAL: Wait for my approval before proceeding to next step.
```

---

### Layer 3: Incremental Verification (Test Before Trust)

**After Antigravity delivers code**:

```typescript
// Step 1: Review for red flags (5 min)
// ❌ Are there ANY `console.log()` statements? (debug code left behind)
// ❌ Are there ANY `any` types? (type safety bypass)
// ❌ Are there ANY `// TODO` comments? (incomplete)
// ❌ Are error paths handled? (Try to find an uncovered case)

// Step 2: Type check immediately (2 min)
$ tsc --noEmit
// Must have ZERO errors

// Step 3: Unit test (if exists) (5 min)
$ npm test -- SupabaseKnowledgeRepository.test.ts
// Must pass 100%

// Step 4: Integration test with real data (10 min)
// If it's a database function:
const repo = new SupabaseKnowledgeRepository();
const result = await repo.save({
  userId: 'test-user',
  decisionType: 'approve',
  title: 'Test',
  summary: null  // Edge case: null summary
});
expect(result).toBeDefined();
expect(result).toMatch(/^[0-9a-f-]{36}$/);  // Is it a valid UUID?

// Step 5: Diff review (10 min)
// git diff --staged
// Check for:
// - Unrelated changes
// - Import statement consistency
// - No accidental deletions
```

**Only after all 5 steps pass**: Approve and move to next file.

---

### Layer 4: Rollback Procedure

**If something goes wrong**:

```bash
# 1. Revert immediately (no debugging in production)
git revert <commit_hash>
git push

# 2. Isolate: Which change broke it?
git log --oneline | head -10
# Identify the problematic commit

# 3. Analyze: What went wrong?
git show <problem_commit>
# Compare against the Antigravity output
# Did Antigravity:
#   a) Generate code that had a logic error?
#   b) Make an assumption that was wrong?
#   c) Forget a constraint?

# 4. Prevent: Update protocol
# Add new constraint to Layer 2 prompt template
# OR break task into smaller pieces
# OR add new verification step

# 5. Re-attempt: Now that you understand the issue
# Provide explicit guidance to Antigravity:
# "Previous attempt failed because [reason].
#  New requirement: [fix].
#  Show code only after listing failure mode."
```

---

## Real-World Examples

### Example 1: Safe Migration (Multi-File, High Risk)

**Scenario**: Refactor Firebase → Supabase authentication (touches 5+ files)

**Safe Approach**:

```
PHASE 1: Interface Definition
├─ File: src/domain/interfaces/IAuthService.ts
├─ Antigravity task: "Define IAuthService interface (no implementation)"
├─ Verification: Type check only (no runtime)
├─ Approval: Code review + architect sign-off
└─ ✓ PROCEED TO PHASE 2

PHASE 2: Supabase Implementation
├─ File: src/infrastructure/auth/SupabaseAuthService.ts
├─ Antigravity task: "Implement IAuthService using Supabase Auth"
├─ Verification: Unit tests + null handling tests
├─ Approval: Senior dev review
└─ ✓ PROCEED TO PHASE 3

PHASE 3: Refactor UI Layer (ONE FILE AT A TIME)
├─ File A: src/pages/login.tsx
│  ├─ Before: Uses Firebase directly
│  ├─ After: Uses IAuthService via DI container
│  ├─ Verification: Component still renders, form still submits
│  └─ ✓ APPROVE → Move to File B
│
├─ File B: src/pages/profile.tsx
│  ├─ Before: Uses Firebase
│  ├─ After: Uses IAuthService
│  └─ ✓ APPROVE → Move to File C
│
└─ ... (repeat for all files)

PHASE 4: Firebase Removal
├─ Task: Delete all Firebase SDK imports
├─ Verification: tsc --noEmit, npm test
└─ ✓ COMPLETE
```

---

### Example 2: Risky Task (Gemini JSON Generation)

**Scenario**: Antigravity generates code for LLM JSON output parsing (prone to hallucination)

**Safe Approach**:

```
PROMPT:

You are helping generate code for OWLight's Gemini integration.

CRITICAL: Gemini 2.5 Flash does NOT have JSON Mode.
JSON output is unreliable.

TASK: Generate the distillKnowledge() function that:
1. Calls Gemini API
2. Parses JSON response
3. Handles JSON parse errors (retry max 3x, then throw)

FAILURE MODES YOU MUST ADDRESS:
a) Gemini returns text, not JSON → Parse error
b) Gemini returns incomplete JSON → Missing fields
c) Gemini returns valid JSON but wrong schema → Field type error

For each failure mode, show:
- How you detect it
- What error message you log
- What you return to caller

OUTPUT:
[Show code with error handling]
[List the 3 failure modes in comments]
[Show example inputs that trigger each mode]

Wait for my approval before proceeding.
```

**Verification** (before using in production):

```typescript
// Test 1: Valid response
const validResponse = `{ "title": "Test", "summary": "...", ... }`;
const result1 = await parseGeminiResponse(validResponse);
expect(result1).toBeDefined();

// Test 2: Incomplete JSON
const incompleteResponse = `{ "title": "Test",`;
const result2 = await parseGeminiResponse(incompleteResponse);
// Should retry 3x then throw (not crash silently)

// Test 3: Wrong schema
const wrongSchema = `{ "name": "Test" }`;  // Field is "title", not "name"
const result3 = await parseGeminiResponse(wrongSchema);
// Should detect missing fields and either retry or throw with clear error
```

---

## Checklist: Before Each Antigravity Task

- [ ] Task is clear and single-goal (not compound)
- [ ] Schema/context provided in full (no assumptions)
- [ ] Critical constraints listed (null safety, error handling, etc.)
- [ ] Red flag risks identified (hallucination, multi-file, etc.)
- [ ] Verification plan written (tests, type check, manual)
- [ ] Antigravity prompted to "wait for approval"
- [ ] Diff review procedure defined
- [ ] Rollback procedure documented
- [ ] No more than 2 hours of back-and-forth (restart if needed)

---

## Anti-Patterns: What NOT to Do

❌ **"Build the entire authentication system in one shot"**
- Antigravity loses context; code is inconsistent
- Instead: Break into Interface → Implementation → UI refactor

❌ **"Trust the first output; only do code review"**
- Untested code is dangerous
- Instead: Type check → Unit test → Integration test → Code review

❌ **"Let Antigravity proceed without approval"**
- It will hallucinate across files
- Instead: Explicit "Wait for approval" in every prompt

❌ **"Skip verification because we'll catch it in testing"**
- Some bugs survive testing (logic errors, race conditions)
- Instead: Verify as you go; fail fast

---

## Metrics: How Safe Is Your Antigravity Usage?

Track these over time:

| Metric | Healthy | Warning | Critical |
|--------|---------|---------|----------|
| **Bugs found in code review per task** | <1 | 1-2 | >2 |
| **Bugs found in testing per task** | <1 | 1-2 | >2 |
| **Rollbacks due to Antigravity per month** | 0-1 | 2-3 | >3 |
| **Time spent verifying per task** | 20-30 min | 30-60 min | >60 min |
| **Team confidence in Antigravity output** | High | Medium | Low |

If metrics trend toward "Warning" or "Critical", return to safety protocols.

---

## References

- OWASP: *AI Security Testing Guidelines*
- Andrej Karpathy: *"Software 2.0"* (on risk of AI-generated code)
- John Carmack: *On Verification* (importance of testing AI-written code)
