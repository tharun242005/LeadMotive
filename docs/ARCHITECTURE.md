# SignalDesk — Architecture & Technical Specifications

## 1. System Overview

**SignalDesk** is an enterprise-grade AI lead intelligence platform designed specifically for real-estate sales teams in high-velocity markets (grounded in the Bengaluru, India property ecosystem).

It solves the three fundamental bottlenecks in real estate sales conversion:
1. **Prioritisation Triage**: Sales reps receive dozens of inbound leads per day but lack instantaneous signal on who to call within the critical 15-minute golden window.
2. **Intent & Objection Decoupling**: Raw customer messages are unstructured and full of hidden anxieties (pricing per sqft, RERA possession delays, A-Khata legal validity, commute friction).
3. **Execution Confidence**: Sales reps often go into calls cold without practicing objection handling or having ready-to-send WhatsApp drafts tailored to the customer's psychology.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT BROWSER                                 │
│                                                                             │
│  ┌───────────────┐  ┌──────────────────────┐  ┌──────────────────────────┐  │
│  │    NavRail    │  │      LeadQueue       │  │        LeadDetail        │  │
│  │ (Workspace,   │  │  (Search, Priority   │  │ (Intent, Score Math,     │  │
│  │  Intake, AI   │  │   Filters, Metric    │  │  Objections, Timeline,   │  │
│  │  Settings)    │  │   Badges, Skeletons) │  │  Smart Responses)        │  │
│  └───────┬───────┘  └──────────┬───────────┘  └────────────┬─────────────┘  │
│          │                     │                           │                │
│          ▼                     ▼                           ▼                │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                       Workspace State Orchestrator                     │  │
│  │       (React 19 Hooks + LocalStorage Versioned Persistence Layer)     │  │
│  └───────────────────────────────────┬───────────────────────────────────┘  │
└──────────────────────────────────────┼──────────────────────────────────────┘
                                       │ Secure JSON Payload (No API Keys)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      NEXT.JS 16 SERVER-SIDE RUNTIME                         │
│                                                                             │
│  ┌─────────────────┐ ┌───────────────┐ ┌────────────────┐ ┌──────────────┐ │
│  │POST/leads/analyze│ │POST/leads/plan│ │POST/leads/chat │ │POST/rehearsal│ │
│  └────────┬────────┘ └───────┬───────┘ └───────┬────────┘ └──────┬───────┘ │
│           │                  │                 │                 │         │
│           ▼                  ▼                 ▼                 ▼         │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                           AI Client Engine                            │  │
│  │   - Client Override & Server Environment Secret Resolution            │  │
│  │   - JSON Schema Constraint Enforcer (3-10 steps bounds check)         │  │
│  │   - Resilient Bengaluru Real-Estate Heuristic Fallback Engine         │  │
│  └───────────────────────────────────┬───────────────────────────────────┘  │
└──────────────────────────────────────┼──────────────────────────────────────┘
                                       │ HTTPS REST
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                 GOOGLE GEMINI API (gemini-3.8-flash)                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Key Architecture Decisions

### A. Server-Side AI Execution with Zero Browser Exposure
The `GEMINI_API_KEY` never reaches the client bundle. All calls pass through Next.js server route handlers (`/api/leads/analyze`, `/api/leads/plan`, `/api/leads/chat`, `/api/leads/rehearsal`). No browser keys are stored in `localStorage` or exposed via network payloads.

### B. Lead Momentum Plan Architecture
The Momentum Plan endpoint (`POST /api/leads/plan`) operates as an intelligent action engine:
1. **Dynamic Length (3–10 Steps)**: Rejecting fixed templates, plan length dynamically scales with lead complexity (e.g., 4 steps for urgent visit, 6 steps for financing anxieties, 3 steps for discovery).
2. **Personalized Communication Drafts**: Channel-specific drafts (WhatsApp, email, call script) with pre-flight fact check verification lists.
3. **Decision Branches**: Step-level alternative paths (`proceed`, `pause`, `adapt`, `stop`) based on buyer response.
4. **Step Status Lifecycle & Tracking**: Step states (`pending`, `in_progress`, `completed`, `skipped`, `blocked`) persist across sessions with dynamic completion calculations.
5. **Preserving History During Adaptation**: Adapting remaining steps preserves all completed step records while generating fresh future actions and incrementing `planVersion`.

### C. Dual Prioritisation Engine (Deterministic Base + AI Enrichment)
Unlike naive apps that pass the whole ranking problem to an LLM:
1. **Deterministic Base Scoring (0–100)**: Instantly calculated on the client using the authoritative 4-factor mathematical rubric:
   - **Buying Timeline (Max 30 pts)**: Within 30d (30) → 90d (22) → 180d (14) → >180d (7) → Unknown (0)
   - **Explicit Buying Intent (Max 30 pts)**: Visit/decision (30) → Pricing/loan (20) → Compare (12) → Research (6) → Unclear (0)
   - **Requirement Completeness (Max 25 pts)**: Location (5) + Typology (5) + Budget (5) + Timeline (5) + Concrete Constraint (5)
   - **Engagement Depth (Max 15 pts)**: ≥3 turns (15) → 2 turns (10) → Initial substantive message (4) → Unusable (0)
   This is 100% predictable, instant (0ms latency), and explainable to non-technical buyers.
2. **AI Enrichment**: The LLM extracts qualitative nuances (underlying objections with recommended handling, intent classification with explanation, verbatim evidence quotes with verification, suggested response channels).

### D. Server-Side Client Architecture with Official `@google/genai` SDK
All AI calls use a clean separation of concerns:
- `src/lib/ai/client.ts`: Server-only Gemini client utilizing the official `@google/genai` SDK.
- `src/lib/ai/prompts.ts`: Named system/instruction prompts with strict untrusted-input isolation.
- `src/lib/ai/schemas.ts`: Runtime request and response validation with verbatim quotation verification.
- `src/app/api/leads/analyze/route.ts`: Thin route handler with typed error classification (`AIErrorCode`).
- `src/lib/leads/scoring.ts`: Pure, deterministic prioritisation engine.

### C. Resilient Heuristic Fallback Engine
Enterprise software must never break during a live customer demo or internet outage. If no Gemini API key is supplied or if Google Cloud quotas are reached, SignalDesk automatically transitions to its internal heuristic engine, providing high-fidelity Bengaluru-tailored assessments with zero downtime.

### D. Zero-Infra LocalStorage Persistence
Following the assignment guidelines ("in-memory or real DB, your call"), SignalDesk implements a versioned schema storage wrapper (`signaldesk_leads_v1`). This guarantees:
- Zero external database provisioning (no Supabase/PostgreSQL connection string failures during evaluation).
- Instant persistence across page refreshes.
- Safe reset capability with one click via `resetToSeedData()`.

---

## 3. Data Model Specifications

### Core Lead Entity (`src/types/lead.ts`)
```typescript
interface Lead {
  id: string;
  name: string;
  location: string;
  propertyRequirement: string;
  budget: number; // in INR
  buyingTimeline: BuyingTimeline; // immediate | 1_to_3_months | etc.
  customerMessage: string;
  createdAt: string;
  updatedAt: string;
  analysisStatus: "pending" | "analyzing" | "complete" | "error";
  priority: PriorityScore;
  analysis: LeadAnalysis | null;
  copilotMessages: CopilotMessage[];
  rehearsalMessages: RehearsalMessage[];
}
```

### Deterministic Priority Score
```typescript
interface PriorityScore {
  total: number; // 0 to 100
  band: "hot" | "warm" | "cold";
  factors: {
    budget: PriorityFactor;
    timeline: PriorityFactor;
    messageQuality: PriorityFactor;
    locationClarity: PriorityFactor;
    requirementSpecificity: PriorityFactor;
  };
  positiveSignals: string[];
  riskFactors: string[];
}
```

### E. Lead-Contextual AI Sales Coach (`POST /api/leads/chat`)
The AI Sales Coach acts as a dedicated co-pilot for sales reps handling inbound leads:
1. **Strict Context Isolation**: Every request is bounded to the active lead selected in the UI. Conversation histories are stored and persisted per lead (`lead.copilotMessages`), ensuring zero cross-lead context leakage. Switching leads remounts the panel with that lead's isolated history.
2. **Untrusted Input Shielding**: Raw customer inquiry text is isolated within triple quotes (`"""`) with explicit system rules ensuring prompt injections never redefine assistant behavior.
3. **Structured Response Contract**: Returns verified answers with `supportingEvidence` (distinguishing explicit facts from AI interpretations), `uncertainties` (flagging unverified details like floor or facing preferences), and interactive `suggestedNextQuestion` pills.
4. **4-Factor Prioritisation Explainability**: Sales reps can interrogate priority bands ("Why is this lead Hot rather than Warm?"), receiving mathematically grounded explanations mapped to Timeline (30), Intent (30), Completeness (25), and Depth (15).
5. **Salesperson Primacy**: The coach never automatically messages customers; it generates recommendations and assertive scripts that the salesperson reviews, customizes, and dispatches.

### F. Objection Rehearsal Studio (`POST /api/leads/rehearsal`)
The Objection Rehearsal Studio transforms passive analysis into active sales capability:
1. **Dual Operational Modes**:
   - `roleplay`: The Gemini model assumes the persona of the prospective buyer (e.g., Priya Sharma worried about school bus commutes or Arjun Reddy anxious about high EMIs). It responds realistically with authentic resistance and questions.
   - `coach`: When the salesperson requests a debrief, the model switches roles to an expert sales coach, evaluating the transcript across 4 structured dimensions (1–5 scale):
     - *Empathy & Rapport*: Validating customer concerns without defensive pushback.
     - *Objection Addressing*: Factual, grounded resolution of the specific worry.
     - *Value Proposition*: Anchoring to Bengaluru project attributes (amenities, location, pricing).
     - *Call-to-Action Clarity*: Securing a concrete next step (site visit, token advance, zoom call).
2. **Context Isolation**:
   - Rehearsal transcripts are saved independently under `lead.rehearsalMessages`.
   - Rehearsals are strictly quarantined from production lead inquiries and customer-facing drafts.
3. **Non-Prediction Disclaimer**:
   - Every coaching scorecard includes a prominent disclaimer: *"Coaching feedback is an educational evaluation of conversation technique and does not guarantee or predict actual sales conversion."*

---

## 4. Complete Application Route Map

| Path | Type | Function |
|---|---|---|
| `/` | Static | Public homepage with product overview, interactive lead preview, scoring inspector, and Lead Momentum Plan showcase |
| `/workspace` | Static | Full sales intelligence workbench: 3-pane lead queue, priority triage, AI analysis card, Deal Velocity timeline, and Contextual Coach |
| `/workspace/momentum` | Static | Dedicated Momentum Plan studio with dynamic 3–10 step execution roadmap, response drafts, decision branches, and progress tracker |
| `/api/leads/analyze` | Dynamic | Server-side AI lead analysis extracting intent, requirements, objections with grounded quotes, recommended action, and response draft |
| `/api/leads/chat` | Dynamic | Contextual sales coaching endpoint with grounded answers, uncertainties, and follow-up prompt chips |
| `/api/leads/rehearsal` | Dynamic | Interactive objection practice endpoint supporting buyer roleplay simulation and 4-dimension coaching evaluation |
| `/api/leads/plan` | Dynamic | Dynamic action plan generator with step adaptation and history preservation |
| `/api/leads/diagnostics` | Static | Health check verifying Gemini API key configuration, model name, and ping latency |

---

## 5. Storage Architecture & Offline Resilience

1. **Versioned Browser-Local Persistence (`signaldesk_leads_v1`)**:
   - Leads, momentum plans, copilot messages, and rehearsal transcripts persist in `localStorage`.
   - Resilient against page refreshes, tab closures, and browser restarts.
   - Corrupt JSON payloads are safely caught and reset to canonical seed data without throwing unhandled exceptions.
2. **Canonical Bengaluru Synthetic Dataset**:
   - Six pre-seeded representative Bengaluru profiles (Priya Sharma, Arjun Reddy, Meera Patel, Rajesh Nair, Sneha Kulkarni, Deepak Gowda).
   - Instant "Reset Demo Data" action in the user menu restores the canonical baseline in 0ms.
3. **Graceful Heuristic Fallback**:
   - Every AI endpoint features a deterministic offline heuristic engine.
   - If `GEMINI_API_KEY` is omitted, missing, or rate-limited, the system transparently serves high-fidelity offline responses with typed metadata (`mode: "fallback"`, `provider: "offline-heuristic"`).
   - The UI never fakes live AI status.

---

## 6. Security & Compliance
- **No Client-Side Secrets**: All API calls are executed strictly on the server; zero API keys in client JavaScript.
- **No PII Transmission to Public AI Training Pools**: Prompt templates do not include phone numbers or emails in inference payload.
- **Strict Response Schema Validation**: Responses from LLM are validated via runtime typeguards before touching the UI.
- **Untrusted Input Shielding**: Customer messages are wrapped in triple quotes with anti-prompt-injection system instructions.
- **XSS & Code Fence Stripping**: All Markdown blocks returned by Gemini are parsed and sanitized.

