# SignalDesk — Comprehensive Test Verification Plan

This test plan details all automated unit tests, schema validation suites, browser integration walkthroughs, and security audits across SignalDesk.

---

## 1. Automated Test Suite Overview

All unit and integration tests run via `npm test` using the Node.js native test runner (`node --test`).
Total execution time: **~380–400ms**.
**Status**: 43/43 Passing, 0 Failing, 0 Skipped.

```bash
npm test
# Runs:
# node --test tests/scoring.test.mjs tests/plan.test.mjs tests/analysis.test.mjs tests/chat.test.mjs tests/rehearsal.test.mjs tests/security_and_resilience.test.mjs
```

---

## 2. Test Suite Breakdown

### A. 4-Factor Deterministic Scoring Tests (`tests/scoring.test.mjs` — 6 tests)
1. **Factor Point Ceilings**: Strictly matches Prompt 3.1 specification (Timeline: 30 pts, Intent: 30 pts, Completeness: 25 pts, Depth: 15 pts).
2. **Priority Bands**: Verifies exact thresholds (Hot: 75–100, Warm: 45–74, Cold: 0–44).
3. **Canonical Hot Lead**: Priya Sharma scores 89/100 (Hot band).
4. **Canonical Warm Lead**: Arjun Reddy scores 71/100 (Warm band).
5. **Canonical Cold Lead**: Deepak Gowda scores 20/100 (Cold band).
6. **Mathematical Invariants**: Proves the scoring function is pure, deterministic, and bounded strictly within 0–100 with zero NaN or undefined values.

### B. Lead Momentum Plan Contract Tests (`tests/plan.test.mjs` — 5 tests)
1. **Dynamic Step Length Validation**: Validates dynamic bounds (3 to 10 steps) based on lead urgency.
2. **Schema & Decision Branches**: Validates all required step properties, communication drafts, and structured `if_customer_says` branches.
3. **Adaptation History Preservation**: Submits a plan with Step 1 `completed`; verifies Step 1 is preserved with identical ID and completion timestamp while subsequent steps adapt.
4. **Dynamic Progress Mathematics**: Accurately computes percentage completion across pending, in-progress, completed, and skipped states.
5. **Blocked Step Status**: Verifies that transitioning a step to `blocked` requires and stores a clear operational reason note.

### C. AI Analysis & Schema Validation Tests (`tests/analysis.test.mjs` — 4 tests)
1. **Required Schema Fields**: Verifies all 6 required fields (`summary`, `intent`, `requirements`, `objections`, `recommendedNextAction`, `suggestedCustomerResponse`).
2. **Malformed Payload Rejection**: Rejects missing properties, null objects, or non-JSON payloads.
3. **Verbatim Quotation Grounding**: Compares extracted objection quotes against the raw customer text; flags hallucinated quotes with `verified: false` or `[Unverified Quote]`.
4. **Enum Clamping & Confidence Bounds**: Enforces 0.0–1.0 bounds on intent confidence and maps unknown categories to safe defaults.

### D. Contextual AI Sales Coach Tests (`tests/chat.test.mjs` — 9 tests)
1. **Structured Coach Response**: Parses valid JSON containing `answer`, `supportingEvidence`, `uncertainties`, and `suggestedNextQuestion`.
2. **Graceful Fallback**: Handles raw text or markdown code fences without crashing.
3. **Missing Answer Rejection**: Rejects payloads lacking an `answer` field.
4. **Triple-Quote Injection Shielding**: Verifies `buildChatPrompt` wraps raw customer inquiries in `"""` and includes strict anti-override system instructions.
5. **Financing Query Grounding**: Verifies response grounds advice in the selected lead's stated budget and loan anxiety.
6. **Priority Query Explanation**: Explains Hot vs Warm using the 4-factor scoring rubric.
7. **Assertive Reply Assistance**: Generates alternative-choice closing questions.
8. **30-Second Opener Assistance**: Generates natural telephone call openers referencing the lead's exact locality and requirements.
9. **Unknown Detail Flagging**: Identifies missing Vaastu facing and floor preferences.

### E. Objection Rehearsal Studio Tests (`tests/rehearsal.test.mjs` — 12 tests)
1. **Roleplay Buyer Response Validation**: Parses valid buyer roleplay messages.
2. **Empty Reply Rejection**: Rejects empty buyer responses.
3. **Coaching Rubric Validation**: Validates the 4-dimension 1–5 scoring rubric (`empathyAndRapport`, `objectionAddressing`, `valueProposition`, `callToActionClarity`).
4. **Score Clamping**: Enforces bounds (overall 1–10, dimension scores 1–5).
5. **Buyer Persona Grounding**: Verifies buyer persona adopts the lead's specific anxieties and shields raw inquiry text.
6. **Opening Move Generation**: Instructs the buyer to open the conversation if the message is empty.
7. **Educational Non-Prediction Disclaimer**: Verifies coaching prompt mandates the non-conversion prediction disclaimer.
8. **Priya Sharma Rehearsal Fallback**: Simulates school commute and traffic objections.
9. **Arjun Reddy Rehearsal Fallback**: Simulates EMI and budget anxiety.
10. **Pushback Dynamics**: Simulates realistic buyer skepticism if the salesperson gives a weak or dismissive reply.
11. **Comprehensive Debrief Generation**: Produces 4-dimension scores, strengths, key improvement, and suggested rewrite.
12. **Defensive Response Penalisation**: Rehearsal coach penalises lack of empathy or missing CTA.

### F. Security & Resilience Suite (`tests/security_and_resilience.test.mjs` — 7 tests)
1. **Fallback Analysis Execution**: Generates deterministic evaluation without crashing when `GEMINI_API_KEY` is omitted.
2. **Prompt Injection Shielding (Analysis)**: Neutralizes malicious instructions embedded inside customer inquiries.
3. **Prompt Injection Shielding (Coach)**: Neutralizes system prompt overrides in contextual chat inquiries.
4. **Cross-Lead Context Isolation (Priya)**: Verifies Priya's rehearsal session does not leak Arjun's loan details.
5. **Cross-Lead Context Isolation (Arjun)**: Verifies Arjun's session does not leak Meera's hidden cost details.
6. **Educational Safety Disclaimer**: Verifies all debriefs explicitly state scores do not predict sales conversion.
7. **Boundary Resilience**: Handles extremely long customer messages (10,000+ characters) without throwing unhandled exceptions.

---

## 3. Browser Verification Matrix

Verified across desktop and mobile viewports:

| Viewport | Dimensions | Areas Verified | Status |
|:---|:---|:---|:---|
| **Desktop 1080p** | 1440 × 900 | 3-pane workbench layout, sidebar queue, analysis card, rehearsal modal, momentum planner | **PASS** |
| **Laptop Widescreen** | 1280 × 800 | Grid responsiveness, priority meter layout, sticky header, modal focus traps | **PASS** |
| **Mobile Standard** | 390 × 844 | Single-column stack, mobile nav drawer, rehearsal chat composer, touch buttons | **PASS** |
| **Mobile Compact** | 360 × 800 | Lead card text truncation, filter pill horizontal scroll, budget badge scannability | **PASS** |

---

## 4. Static Code Quality Verification

```bash
# TypeScript compiler check
npx tsc --noEmit
# Result: 0 errors, clean exit

# ESLint verification
npm run lint
# Result: 0 errors, 0 warnings

# Production Next.js build
npm run build
# Result: Compiled successfully, 11/11 static/dynamic routes generated
```
