# SignalDesk — Lead Momentum Plan Architecture & Design

## 1. Feature Purpose & Value Proposition

**Lead Momentum Plan** is SignalDesk's intelligent, personalized action-planning system designed for high-velocity real estate sales in Bengaluru.

In typical CRM platforms, lead intelligence ends at static summaries or generic checklists. A salesperson is told *who* the lead is, but is left to guess:
- What exact sequence of steps to execute first.
- What to say to the buyer across specific channels (WhatsApp, call script, email).
- What facts must be verified before making claims.
- What to do if the customer objects, goes silent, or requests more time.
- How to preserve their completed progress when the customer's circumstances change.

Lead Momentum Plan answers:
> *"Given this customer's requirements, buying timeline, stated concerns, readiness, and interaction history, what should the salesperson do next, in what order, what should they say, and how should they adapt according to the customer's response?"*

---

## 2. Capability Differentiation Matrix

SignalDesk features 5 distinct, complementary capabilities:

| Capability | Role in Sales Workflow | Core Output | Persistence & Scope |
|:---|:---|:---|:---|
| **AI Lead Analysis** | Ingest raw inquiry & extract intent | Intent, urgency, budget match, key objections | Static analysis snapshot per lead |
| **Deterministic Scoring** | Instant 0ms prioritization triage | 100-point transparent score (Timeline, Intent, Completeness, Depth) | Deterministic math recalculated on lead edits |
| **Contextual AI Coach** | Ad-hoc sales Q&A assistant | Dynamic conversational answers grounded in lead parameters | Transient conversation thread per lead |
| **Objection Rehearsal** | In-character buyer voice simulation | Roleplay dialogue with debrief score & coaching feedback | Simulated training transcripts (never mixed with real history) |
| **Lead Momentum Plan** | Operational execution & action roadmap | Variable 3–10 step dynamic action sequence with grounded drafts, verification checks & branches | Versioned persistent working document with real-world status tracking |

---

## 3. Dynamic Plan Length: Non-Negotiable Architecture

**The number of steps is strictly determined dynamically for each lead.** A fixed 3-step or 5-step template is explicitly rejected by the system.

### A. Length Calibration Rubric
- **Urgent / Ready-to-Visit Lead (3–4 Steps)**: Focuses directly on immediate visit scheduling, site prep, builder dossier, and school proximity validation. Does not pad the plan with redundant financing 101 or basic discovery. (e.g., Priya Sharma: 4 steps).
- **Complex / High-Anxiety / Financing-Sensitive Lead (5–7 Steps)**: Systematically structures pre-approval, cost-breakdown clarification, A-Khata legal verification, builder RERA milestone review, and phased decision checkpoints before recommending a visit. (e.g., Arjun Reddy: 6 steps).
- **Sparse / Early Discovery Lead (3 Steps)**: Clarifies missing criteria (possession date, commute corridor, budget elasticity) before proposing concrete property actions. Distinguishes unknowns from assumptions. (e.g., Deepak Gowda: 3 steps).
- **Complex Enterprise / Multi-Stakeholder Lead (8–10 Steps)**: Reserved for high-value transactions involving multiple decision makers, institutional financing, or parallel property comparisons.

### B. Runtime Schema Enforcement
`validatePlanResponse()` enforces:
```typescript
if (!Array.isArray(plan.steps) || plan.steps.length < 3 || plan.steps.length > 10) {
  throw new Error(`Plan steps count (${plan.steps?.length}) must be between 3 and 10.`);
}
```

---

## 4. End-to-End Request & Response Schema

### Endpoint: `POST /api/leads/plan`

### Request Payload (`PlanRequest`):
```typescript
export interface PlanRequest {
  lead: Lead;
  analysis?: AIAnalysis;
  objective: PlanningObjective;
  communicationFormat?: CommunicationFormat;
  additionalInstructions?: string;
  adaptationReason?: string;
  existingPlan?: LeadMomentumPlan;
}
```

### Response Payload (`PlanResponse`):
```typescript
export interface PlanResponse {
  plan: LeadMomentumPlan;
  metadata: AIMetadata;
}
```

### Domain Model (`LeadMomentumPlan`):
```typescript
export interface LeadMomentumPlan {
  planId: string;
  leadId: string;
  planVersion: number;
  planTitle: string;
  objective: PlanningObjective;
  communicationFormat: CommunicationFormat;
  leadSituationSummary: string;
  strategyRationale: string;
  assumptions: string[];
  unknowns: string[];
  successDefinition: string;
  steps: MomentumPlanStep[];
  generatedAt: string;
  updatedAt: string;
  providerMetadata: AIMetadata;
}

export interface MomentumPlanStep {
  stepId: string;
  sequenceNumber: number;
  title: string;
  category: "outreach" | "discovery" | "objection_handling" | "site_visit" | "dossier_delivery" | "closing_milestone";
  purpose: string;
  instructions: string;
  whySuitable: string;
  supportingEvidence: string[];
  timingTrigger: string;
  prerequisites: string[];
  expectedOutcome: string;
  completionCriteria: string;
  risksAndUnknowns: string[];
  contingency: string;
  status: "pending" | "in_progress" | "completed" | "skipped" | "blocked";
  blockedReason?: string;
  statusUpdatedAt?: string;
  draft?: CommunicationDraft;
  branches: DecisionBranch[];
}

export interface CommunicationDraft {
  channel: CommunicationFormat;
  tone: string;
  body: string;
  targetConcern: string;
  factsToVerify: string[];
  suggestedFollowUpQuestion?: string;
  fallbackApproach?: string;
}

export interface DecisionBranch {
  condition: string;
  triggerSignal: string;
  recommendedAction: string;
  impactOnPlan: "proceed" | "pause" | "adapt" | "stop";
}
```

---

## 5. Grounding, Pre-Flight Verification & Evidence

### A. Zero-Hallucination Guardrails
The prompt forbids the model from:
1. Inventing unverified builder discounts, loan interest rates, or possession guarantees.
2. Claiming properties are RERA-cleared or A-Khata without explicit documentation.
3. Pretending past communication occurred when it did not.
4. Treating Objection Rehearsal roleplay dialogue as actual customer history.

### B. Pre-Flight Fact-Check Chips
Every communication step requiring customer interaction produces a `factsToVerify` array. For example:
- *"Confirm unit 1402 on 14th floor is still unreserved in developer inventory."*
- *"Verify Whitefield school bus route pickup coordinates for Greenwood High."*
- *"Confirm whether SBI home loan special 8.4% rate applies to this tower."*

The UI renders these as visual verification chips above the copy action.

---

## 6. Execution Lifecycle, Progress & Adaptation

### A. Step Status Lifecycle
Steps transition between 5 states:
- `pending`: Awaiting execution.
- `in_progress`: Salesperson is actively working on the step.
- `completed`: Successfully executed in the real world.
- `skipped`: Intentionally bypassed due to contextual change.
- `blocked`: Execution prevented by external factors (requires reason, e.g. "Buyer traveling until Friday").

### B. Dynamic Progress Tracking
Overall plan progress is computed dynamically:
$$\text{Progress} = \frac{\text{Completed Steps} + (\text{Skipped Steps} \times 0.5)}{\text{Total Steps}} \times 100\%$$
Progress is never hardcoded.

### C. Adaptation vs. Regeneration
- **`Adapt Remaining Steps`**: When a buyer responds with new information, the salesperson provides an adaptation reason. The system preserves all `completed` and `skipped` steps with their original timestamps, and only regenerates the `pending`, `in_progress`, and `blocked` steps. The `planVersion` is incremented.
- **`Regenerate Plan`**: Wipes the plan and generates a fresh strategy from scratch. Requires explicit salesperson confirmation in a modal to prevent accidental loss of completed work.

---

## 7. Dual-Mode Telemetry & Resilience

SignalDesk provides 100% transparency on AI invocation:
- **Live Mode**: Invokes `gemini-3.8-flash` with native JSON mode and returns `provider: "google-gemini"`, `mode: "live"`, `fallbackUsed: false`.
- **Heuristic Fallback Engine**: If `GEMINI_API_KEY` is not present, the system runs a deterministic Bengaluru real estate planning heuristic engine that returns calibrated 3-, 4-, or 6-step plans with full schemas, localized drafts, fact-checks, and decision branches. It explicitly returns `provider: "offline-heuristic"`, `mode: "fallback"`, `fallbackUsed: true`.
- **Zero Fabrication**: A fallback response is never labeled as live AI.

---

## 8. Bengaluru Localized Demonstrations

Canonical demonstration leads:
1. **Priya Sharma (Hot • 85/100)**: Whitefield 3 BHK ready-to-move apartment for immediate family relocation. 4-step Fast-Track Plan focused on school bus routes (Greenwood High) and immediate Saturday site tour.
2. **Arjun Reddy (Warm • 68/100)**: Sarjapur Road 3 BHK under-construction villa. 6-step Risk-Mitigation Plan addressing 12-month delivery buffer, payment milestone restructuring, and A-Khata legal audit.
3. **Deepak Gowda (Cold • 32/100)**: Yelahanka 4 BHK inquiry with sparse requirements. 3-step Discovery Plan clarifying possession timeline and budget alignment.
