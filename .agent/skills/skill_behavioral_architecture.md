# Skill: Behavioral Architecture for Admin Systems

**Skill ID**: behavioral_architecture_admin  
**Category**: UX/Behavioral Design  
**Created**: 2026-01-24  
**Status**: Production Ready  

---

## Overview

This skill codifies the behavioral design patterns that make administrative systems psychologically safe and intrinsically motivating. It applies principles from behavioral economics, narrative design, and positive psychology to transform mundane work into a coherent daily ritual.

**Application**: OWLight's 5-Phase daily experience design (Morning Ritual → Twilight Ritual).

---

## Core Principle: The Narrative Arc

Administrative work is not a series of isolated tasks—it is a **daily narrative** with a beginning, middle, climax, and resolution. Each phase of work should map to a psychological state and be designed to shift the user's mental context appropriately.

| Phase | Psychological State | Design Goal | Mechanism |
|-------|-------------------|------------|-----------|
| **Morning Ritual** | Transition (distracted → focused) | Anchoring & autonomy | Value Cards (Priming effect) |
| **Personal Dashboard** | Motivation (worthlessness → efficacy) | Visibility of impact | Wisdom Points, Thanks Network |
| **Work Overlay** | Support (confusion → clarity) | Real-time scaffolding | Guardian Mode, DAP Guides |
| **Sanctuary Protocol** | Safety (isolation → connection) | Psychological safety | Anonymous SOS, Receptive AI |
| **Twilight Ritual** | Closure (incompleteness → peace) | Positive memory encoding | Give-focused reflection (Peak-End Law) |

---

## Phase 1: Morning Ritual (Priming)

### Objective
Transform automatic, reactive work mindset into intentional, values-aligned action.

### Key Mechanism: The Priming Effect (Behavioral Economics)

**Research Base**: Richard Thaler's EAST Framework (Easy, Attractive, Social, Timely)

When individuals consciously choose a value before acting, they unconsciously align subsequent behaviors with that value—without any additional enforcement mechanism.

### Implementation: Value Cards

**Design Specification**:
```
Question: "今日、あなたが一番大切にしたい『価値』はなんですか？"

Options:
1. Integrity (天秤) - "見えないところでも、正しい判断をする心"
2. Challenge (炎) - "昨日より一つでも、新しいことを試す勇気"
3. Kindness (新芽) - "関わるすべての人へ、敬意と配慮を持つ"

Button: "暁の誓い" (Morning Oath)
Visual Transition: Soft sunlight → normal work lighting
```

**Behavioral Logic**:
- **Default is active**: Card selection is REQUIRED to proceed (no skip option)
- **One-time per day**: Selection resets at session start
- **Visual anchor**: The chosen card's icon appears subtly in the UI corner throughout the day
- **No scoring**: This is NOT gamification; it's a ritual, not a race

### Measurement
- Track which values are chosen daily (expect seasonal & weekly patterns)
- Correlate with incident reports: employees who choose "Integrity" should show fewer errors
- Survey: "Did the morning ritual make you feel more intentional today?"

---

## Phase 2: Personal Dashboard (Self-Efficacy)

### Objective
Materialize the invisible impact of knowledge work, converting abstract effort into visible, quantifiable contribution.

### Key Mechanism: Visibility of Impact

**Research Base**: Albert Bandura's Self-Efficacy Theory
- Belief in one's capability to execute behaviors necessary to produce specific outcomes
- **Critical insight**: If you can't see your impact, you cannot develop self-efficacy

### Implementation: The Wisdom Forest

**Component 1: Wisdom Points & Time Saved**
```
Display: "Wisdom Points: 12,450"
Below: "組織全体で約45時間が節約されました。"
Visualization: Bar chart showing daily/weekly savings trend
```

**Behavioral Logic**:
- Not just "points" (gamification trap), but **"time returned to humanity"**
- Explicit translation: "45 hours = ~2 full workdays for your organization"
- Updated in real-time as new knowledge is accessed

**Component 2: Thanks Network**
```
Visualization: Interactive graph with user at center
- Nodes: Colleagues who were helped
- Edges: Directional arrows showing "gave help" vs "received help"
- Hover: Brief description of interaction
```

**Behavioral Logic**:
- Combats isolation by making invisible relationships visible
- Triggers oxytocin (bonding) rather than dopamine (excitement)
- No ranking or leaderboard; emphasis on reciprocity

**Component 3: Shadow CV (Implicit Recognition)**
```
List:
- 「保険年金課の繁忙期支援（5件）」
- 「マニュアル行間補完（12件）」
- 「後輩メンタリング（3名）」

Privacy Default: PRIVATE (only user can see)
Action: "人事評価に提出" button (opt-in submission at review time)
```

**Behavioral Logic**:
- Honors the **"徳"（virtue）** that formal evaluation systems miss
- Preserves agency: you decide whether to highlight this work
- Prevents surveillance; encourages autonomous choices about visibility

### Measurement
- Daily active usage of Personal Dashboard
- Correlation: Time Saved trend vs. sick leave, turnover
- Qualitative: "Did you feel your work mattered today?"

---

## Phase 3: Work Overlay (Real-Time Support)

### Objective
Provide just-in-time scaffolding without interrupting workflow.

### Key Mechanism: The Guardian

**Research Base**: Error prevention psychology (Swink, Norman)
- Errors happen when cognitive load exceeds capacity
- **System design cannot eliminate load, but can redistribute it**

### Implementation: Guardian Mode (AI-Powered Validation)

**Design Specification**:
```
Trigger: Critical field changes in legacy financial system
- Contract amount ↔ Invoice amount (mismatch detection)
- Legal citation (format validation)
- Budget code (does it exist in current fiscal year?)

Response: Full-screen warning modal
- Color: Red/Orange (not casual; genuinely urgent)
- Tone: "これは大事です。修正するまで進めません。" (respectful, not accusatory)
- Action: Must fix, cannot skip
```

**Behavioral Logic**:
- **Physical impossibility** replaces willpower
- Shifts burden from individual to system
- **Prevents shame & liability**: "I couldn't make the error" vs. "I made an error"

### Implementation: DAP Guide (Contextual Help)

**Design Specification**:
```
Trigger: Cursor hover on specialized terminology
- "執行伺書ID" → Shows: "承認を求める公式文書の識別番号です。"
- "支出科目" → Shows: "お金が何に使われるかを分類するコード"

Presentation: Tooltip with icon (?) leading to Supabase knowledge base

Access: Zero additional steps; integrated into existing UI
```

**Behavioral Logic**:
- Eliminates the "context switch" cost of opening manual
- Builds mental model incrementally (spaced repetition via repeated exposure)

### Implementation: Karma Stamina (Reciprocity Loop)

**Mechanism**:
```
When senior staff (係長+) use AI search for own work:
- "徳 (Stamina)" bar decreases by 1 unit per search
- Bar only recovers via:
  a) "部下ドラフト承認" (approving junior's work)
  b) "ナレッジ投稿" (posting new knowledge)
```

**Behavioral Logic**:
- **Loss Aversion** (Kahneman): losing something hurts more than gaining equivalent value
- Creates natural incentive: "I'm losing stamina; I should mentor or share"
- Gamifies knowledge transfer without explicit game mechanics

### Measurement
- Guardian Mode block frequency (should decrease over time as staff learns)
- DAP Guide usage patterns (which terms most accessed?)
- Karma Stamina recovery rate (indicator of team knowledge-sharing health)

---

## Phase 4: Sanctuary Protocol (Psychological Safety)

### Objective
Create a safe channel for vulnerability before it escalates to crisis.

### Key Mechanism: Non-Transactional Support

**Research Base**: Amy Edmondson's Psychological Safety
- Belief that interpersonal risk is safe in the team environment
- Critical for learning, error reporting, helping others

### Implementation: Sanctuary Widget

**Design Specification**:
```
Access: Discrete icon (💜 or quiet color) always visible, never intrusive
Opening: Transitions to dark theme, soft colors, gentle typography
AI Behavior: 
  - Accepts all concerns without judgment
  - Reflects back: "つまり、あなたは...と感じている？"
  - Suggests: "この状況では、こういう選択肢がありますね"
  - No documentation: Chat history is not saved to business records

Example dialogue:
User: "給付金の計算で大きなミスをしてしまいました。誰にも言えません。"
AI: "そのような状況は、とても大変ですね。それを認識した今、あなたはすでに修正へ向かう準備ができています。"
```

**Behavioral Logic**:
- Non-judgmental acceptance reduces shame
- Receptive listening (no problem-solving mode) enables emotional processing
- No permanent record = lower barrier to opening up

### Implementation: SOS Beacon

**Design Specification**:
```
Access: ⚡ button within Sanctuary Widget
Action: "信頼できるシニア職員に匿名で通知します"
Senior Notification: Push to trusted mentor with minimal details
Follow-up: Senior can offer support without workplace politics
Resolution: After resolution, chat logs auto-delete

Example scenario:
Junior: Clicks SOS after multiple error corrections in one day
Senior: Receives: "⚡ SOS from anonymous staff member. Emotional support needed."
Senior: Offers: 1-on-1 mentoring or flex schedule
Resolution: Logs deleted after 48 hours
```

**Behavioral Logic**:
- **Anonymity** reduces social cost of asking for help
- **Human connection** (vs. pure AI) signals care
- **Auto-deletion** provides closure and prevents institutional memory of struggle

### Measurement
- Sanctuary Widget usage frequency (should spike before mental health incidents)
- SOS beacon activation rate (should be rare; indicates system is early-warning)
- Correlation: Sanctuary usage → reduced sick leave, improved retention

---

## Phase 5: Twilight Ritual (Closure)

### Objective
Encode the day's memories with positive valence and signal rest.

### Key Mechanism: Peak-End Rule (Kahneman)

**Research Base**: Daniel Kahneman's Peak-End Rule
- People judge experiences based on the most intense moment (peak) + final moment (end)
- **The END is disproportionately influential on overall memory**
- Implication: A good ending can redeem a mediocre day

### Implementation: The Digital Sunset

**Design Specification**:
```
Trigger: "退勤" (Quit) button clicked
Visual Sequence:
  1. Daytime UI → Sunset gradient (orange/pink)
  2. Sunset → Evening gradient (purple/indigo)
  3. Evening → Night sky (dark blue/black)
  
Question (30 seconds into gradient): "今日、誰かの『力』になれましたか？"

Options:
A) "はい" → Opens reflection form
   - "誰にどのようにサポートしましたか？"
   - Input: Specific episode (feeds into Shadow CV)
   - Confirmation: "素晴らしい1日でした。おやすみなさい。"

B) "今日は難しかったです" → AI response
   - "そんな日もあります。ゆっくり休みましょう。"
   - Automatic: Logs day as "Recovery Day" (no judgment)
   
Final Screen: "It's All Right." + Screen fades to black + PC lock triggered
```

**Behavioral Logic**:

1. **Visual metaphor** (day → night) signals transition from work to rest
2. **Time pressure** (30 seconds) prevents overthinking; primes authentic response
3. **Reflection on contribution** activates oxytocin (giving) not dopamine (scoring)
4. **Acceptance of difficulty** (Option B) prevents shame spiral
5. **Forced logout** (screen lock) provides physical boundary
6. **Final message** ("It's All Right") creates psychological closure

### Measurement
- Sentiment of day-end reflections (should be ~80% positive over time)
- Correlation: Twilight Ritual usage → better sleep quality (via exit survey)
- "Recovery Day" frequency (spike = risk indicator for burnout)

---

## Integration: The Daily Narrative Arc

```
06:00 ┌─────────────────────────────────────────────┐
      │ Phase 1: Morning Ritual (Priming)           │
      │ User selects value → "暁の誓い"              │
      └─────────────────────────────────────────────┘
      
06:30 ┌─────────────────────────────────────────────┐
      │ Phase 2: Personal Dashboard (Efficacy)      │
      │ View impact → "You saved 45 hours"          │
      └─────────────────────────────────────────────┘
      
07:00 ┌─────────────────────────────────────────────┐
      │ Phase 3: Work Overlay (Real-time Support)   │
      │ DAP Guide, Guardian Mode, Karma Stamina     │
      │ (continuous throughout work day)            │
      └─────────────────────────────────────────────┘
      
14:00 ┌─────────────────────────────────────────────┐
      │ Phase 4: Sanctuary (if needed)              │
      │ Sanctuary Widget, SOS beacon                │
      │ (available but not intrusive)               │
      └─────────────────────────────────────────────┘
      
17:30 ┌─────────────────────────────────────────────┐
      │ Phase 5: Twilight Ritual (Closure)          │
      │ Digital Sunset → Reflection → Screen black  │
      └─────────────────────────────────────────────┘
```

---

## Anti-Patterns to Avoid

❌ **Avoid: Aggressive Gamification**
- Leaderboards, badges, badges → breeds competition & anxiety
- Use instead: Quiet status visibility (Thanks Network, Shadow CV)

❌ **Avoid: Surveillance Framing**
- Tracking everything staff does → breaks trust
- Use instead: Only track consent-based voluntary sharing

❌ **Avoid: One-Size-Fits-All**
- Same value cards for police, social workers, IT → ignores context
- Use instead: Customizable values per role (police: Duty, Safety, Justice)

❌ **Avoid: Forced Positivity**
- System that punishes "I had a bad day"
- Use instead: Acceptance of difficulty (Recovery Day model)

---

## Verification Checklist

- [ ] All 5 phases implemented and connected
- [ ] Visual/emotional tone consistent (calming, not excitatory)
- [ ] Privacy defaults favor employee (Shadow CV = Private by default)
- [ ] No mandatory public sharing (all opt-in)
- [ ] Accessibility: works for colorblind, low-vision, motor impairments
- [ ] Tested with actual staff (qualitative interviews)
- [ ] Psychological safety metrics established (survey baseline)

---

## Future Enhancements (Post-MVP)

- Seasonal value card variations (Winter: Resilience, Spring: Growth, etc.)
- Personalized AM/PM ritual timing (respect late starters, early starters)
- Team-level ritual (collective morning value selection, team reflection)
- Integration with EAP (Employee Assistance Program) for Sanctuary escalation
- Cross-generational mentoring flow visualization

---

## References

- Richard Thaler & Cass Sunstein: *Nudge* (2008)
- Daniel Kahneman: *Thinking, Fast and Slow* (Peak-End Rule)
- Amy Edmondson: *The Fearless Organization* (Psychological Safety)
- Albert Bandura: *Self-Efficacy* theory
- Barbara Fredrickson: *Positivity* (Broaden-and-Build theory)
