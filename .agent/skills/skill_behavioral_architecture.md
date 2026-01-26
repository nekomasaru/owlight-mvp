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
| **Closing Ritual** | Closure (incompleteness → peace) | Positive memory encoding | Give-focused reflection (Peak-End Law) |

---

## Phase 1: Morning Ritual (Priming)

... (No changes needed until Phase 5) ...

---

## Phase 5: Closing Ritual (Closure)

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
Trigger: "退勤" (Quit) button clicked or /closing accessed
Visual Sequence:
  1. Daytime UI → Dark overlay
  2. Stamp Animation: "承認" (Approved) with sound effect visualization
  
Question: "今日、誰かの『力』になれましたか？" (Reflection)

Final Screen: "It's All Right." + Screen fades to black
```

**Behavioral Logic**:

1. **Stamp Effect** provides visceral sense of completion (Closure).
2. **Reflection on contribution** activates oxytocin (giving) not dopamine (scoring).
3. **Final message** ("It's All Right") creates psychological closure.

### Measurement
- Sentiment of day-end reflections (should be ~80% positive over time)
- Correlation: Closing Ritual usage → better sleep quality (via exit survey)

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
      
17:30 ┌─────────────────────────────────────────────┐
      │ Phase 5: Closing Ritual (Closure)           │
      │ Digital Sunset → Reflection → Stamp         │
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
