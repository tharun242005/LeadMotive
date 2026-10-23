// ============================================================================
// LeadMotive — Lead Domain Types
// ============================================================================

/** Unique identifier for a lead record. */
export type LeadId = string;

/** Analysis workflow state. */
export type AnalysisStatus = "pending" | "analyzing" | "complete" | "error";

/** Customer intent classification produced by AI analysis. */
export type CustomerIntent =
  | "ready_to_buy"
  | "actively_searching"
  | "comparing_options"
  | "early_research"
  | "seeking_information"
  | "callback_request"
  | "unclear";

/** Priority band derived from the deterministic score. */
export type PriorityBand = "hot" | "warm" | "cold";

/** Buying timeline as entered by the lead. */
export type BuyingTimeline =
  | "immediate"       // Within 1 month
  | "1_to_3_months"   // 1–3 months
  | "3_to_6_months"   // 3–6 months
  | "6_to_12_months"  // 6–12 months
  | "beyond_12_months" // More than a year
  | "not_specified";

/** Tone for AI-generated responses. */
export type ResponseTone = "formal" | "friendly" | "assertive";

// ---------------------------------------------------------------------------
// Priority Scoring
// ---------------------------------------------------------------------------

/** Individual factor contributing to the priority score. */
export interface PriorityFactor {
  /** Machine-readable factor name. */
  name: string;
  /** Human-readable label shown in the UI. */
  label: string;
  /** Points contributed by this factor (can be negative). */
  points: number;
  /** Maximum possible points for this factor. */
  maxPoints: number;
  /** Brief explanation of why this score was assigned. */
  reason: string;
}

/** Complete priority assessment for a lead. */
export interface PriorityScore {
  /** Total score (0–100). */
  total: number;
  /** Priority band derived from the score. */
  band: PriorityBand;
  /** Breakdown of individual scoring factors. */
  factors: PriorityFactor[];
}

// ---------------------------------------------------------------------------
// AI Analysis
// ---------------------------------------------------------------------------

/** A single requirement extracted from the customer message. */
export interface ExtractedRequirement {
  /** Short label, e.g. "3 BHK", "Gated community". */
  label: string;
  /** Whether this is explicitly stated or inferred. */
  confidence: "explicit" | "inferred";
  /** Exact customer quote providing evidence if available. */
  evidenceQuote?: string;
}

/** A concern or objection extracted from the customer message. */
export interface ExtractedObjection {
  /** Short label, e.g. "Budget constraint", "Possession delay". */
  label: string;
  /** Severity from the salesperson's perspective. */
  severity: "high" | "medium" | "low";
  /** Exact customer quote providing evidence if available. */
  evidenceQuote?: string;
  /** Concrete recommended handling for the salesperson. */
  recommendedHandling?: string;
}

/** Suggested next action for the salesperson. */
export interface SuggestedAction {
  /** Action type. */
  type: "call" | "whatsapp" | "email" | "site_visit" | "follow_up" | "share_info";
  /** Brief description of what to do. */
  description: string;
  /** Suggested timeframe, e.g. "Within 2 hours", "Tomorrow morning". */
  timeframe: string;
  /** Strategic rationale explaining why this action is recommended now. */
  rationale?: string;
  /** Suggested urgency. */
  urgency?: "immediate" | "high" | "normal" | "low";
}

/** Customer intent classification with explanation. */
export interface CustomerIntentData {
  category: CustomerIntent;
  explanation: string;
}

/** Grounded evidence item linking lead fields to original text. */
export interface LeadEvidenceItem {
  field: string;
  quote: string;
  verified: boolean;
}

/** Touchpoint in the deal velocity timeline. */
export interface TimelineTouchpoint {
  /** Day offset from today. */
  dayOffset: number;
  /** Action label. */
  action: string;
  /** Channel to use. */
  channel: "call" | "whatsapp" | "email" | "site_visit";
  /** Whether this touchpoint is complete. */
  completed: boolean;
}

/** Complete AI analysis result for a lead. */
export interface LeadAnalysis {
  /** One-paragraph summary of this lead. */
  summary: string;
  /** Classified customer intent. */
  intent: CustomerIntent;
  /** Detailed customer intent object. */
  customerIntent?: CustomerIntentData;
  /** Confidence in the intent classification (0–1). */
  intentConfidence: number;
  /** Key requirements extracted from the customer message. */
  requirements: ExtractedRequirement[];
  /** Alias for keyRequirements. */
  keyRequirements?: ExtractedRequirement[];
  /** Objections or concerns with evidence and recommended handling. */
  objections: ExtractedObjection[];
  /** Recommended next action. */
  recommendedAction: SuggestedAction;
  /** Alias for recommendedNextAction. */
  recommendedNextAction?: SuggestedAction;
  /** Suggested response to the customer. */
  suggestedResponse: string;
  /** Deal velocity timeline — touchpoints over the next few weeks. */
  timeline: TimelineTouchpoint[];
  /** Unresolved facts needed for a better recommendation. */
  missingInformation?: string[];
  /** Grounded evidence quotes mapped and verified against input text. */
  evidence?: LeadEvidenceItem[];
  /** Important limitations or ambiguous details. */
  uncertainties?: string[];
  /** Timestamp when analysis was generated. */
  analyzedAt: string;
  /** Whether this analysis is seeded fixture data. */
  isSeeded: boolean;
  /** Model name if live. */
  model?: string;
  /** Complete AI execution metadata. */
  meta?: {
    provider: "google-gemini" | "groq" | "offline-heuristic" | "seeded-fixture";
    model: string | null;
    mode: "live" | "fallback" | "fixture";
    fallbackUsed: boolean;
    secondaryUsed?: boolean;
    primaryFailureReason?: string;
    latencyMs: number;
    message?: string;
  };
}

// ---------------------------------------------------------------------------
// Conversation
// ---------------------------------------------------------------------------

/** Role in a copilot conversation. */
export type CopilotRole = "user" | "assistant";

/** Single message in the contextual copilot chat. */
export interface CopilotMessage {
  id: string;
  role: CopilotRole;
  content: string;
  timestamp: string;
  supportingEvidence?: string[];
  uncertainties?: string[];
  suggestedNextQuestion?: string;
  isError?: boolean;
  provider?: "google-gemini" | "groq" | "offline-heuristic";
}

/** Role in an objection rehearsal session. */
export type RehearsalRole = "salesperson" | "customer";

/** Single message in a rehearsal session. */
export interface RehearsalMessage {
  id: string;
  role: RehearsalRole;
  content: string;
  timestamp: string;
}

/** Dimension score in the coaching rubric (rated 1 to 5). */
export interface RubricDimension {
  dimension: "concern_addressing" | "empathy_and_clarity" | "evidence_relevance" | "next_step_drive";
  label: string;
  score: number; // 1 to 5
  explanation: string;
}

/** AI coaching feedback on a rehearsal response. */
export interface RehearsalFeedback {
  /** Overall score (1–10). */
  score: number;
  /** Summary evaluation of the rehearsal. */
  summary?: string;
  /** Key strengths demonstrated by the salesperson. */
  strengths: string[];
  /** Assessment of whether the customer's core concern was addressed. */
  concernAddressed: {
    addressed: boolean;
    explanation: string;
  };
  /** Multi-dimensional 1–5 rubric assessment. */
  dimensions: RubricDimension[];
  /** Areas for improvement. */
  improvements: string[];
  /** One key specific improvement highlighted. */
  keyImprovement: string;
  /** A suggested stronger reply tailored to the actual transcript. */
  suggestedAlternative: string;
  /** Explicit disclaimer that coaching score does not guarantee commercial outcome. */
  disclaimer?: string;
}

/** Objection rehearsal scenario type. */
export type RehearsalScenarioType = "immediate_buyer" | "documented_concern";

/** Full Rehearsal Session state for a lead. */
export interface RehearsalSession {
  sessionId: string;
  leadId: string;
  scenarioType?: RehearsalScenarioType;
  scenarioTitle?: string;
  isHypothetical?: boolean;
  targetObjection?: string;
  objective: string;
  messages: RehearsalMessage[];
  feedback: RehearsalFeedback | null;
  status: "in_progress" | "debrief_ready" | "completed";
  startedAt: string;
  updatedAt: string;
}


// ---------------------------------------------------------------------------
// Lead (Root Entity)
// ---------------------------------------------------------------------------

/** A real-estate sales lead. */
export interface Lead {
  /** Stable unique identifier. */
  id: LeadId;

  // -- Customer-provided information (never overwritten by AI) --
  /** Customer's full name. */
  name: string;
  /** Bengaluru locality, e.g. "Whitefield", "Sarjapur Road". */
  location: string;
  /** Property requirement, e.g. "3 BHK apartment, gated community". */
  propertyRequirement: string;
  /** Budget in INR (stored as number, displayed with ₹/lakh/crore). */
  budget: number;
  /** How soon the customer plans to buy. */
  buyingTimeline: BuyingTimeline;
  /** Free-text customer message or conversation transcript. */
  customerMessage: string;

  // -- System fields --
  /** ISO timestamp of lead creation. */
  createdAt: string;
  /** ISO timestamp of last update. */
  updatedAt: string;

  // -- AI analysis --
  /** Current analysis workflow status. */
  analysisStatus: AnalysisStatus;
  /** Latest AI analysis, or null if not yet analyzed. */
  analysis: LeadAnalysis | null;

  // -- Priority --
  /** Deterministic priority score and band. */
  priority: PriorityScore;

  // -- Conversation histories (stored locally) --
  /** Contextual copilot messages for this lead. */
  copilotMessages: CopilotMessage[];
  /** Objection rehearsal messages for this lead. */
  rehearsalMessages: RehearsalMessage[];
  /** Objection rehearsal session record, if any. */
  rehearsalSession?: RehearsalSession | null;
}

// ---------------------------------------------------------------------------
// Lead Momentum Plan Types
// ---------------------------------------------------------------------------

export type PlanningObjective =
  | "first_follow_up"
  | "address_objection"
  | "clarify_requirements"
  | "progress_buyer"
  | "re_engage_dormant"
  | "complete_strategy"
  | "custom";

export type CommunicationFormat =
  | "whatsapp"
  | "email"
  | "call_script"
  | "general_action";

export type StepStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "skipped"
  | "blocked";

export type StepCategory =
  | "outreach"
  | "discovery"
  | "objection_handling"
  | "site_visit_prep"
  | "proposal"
  | "follow_up"
  | "internal_prep";

export interface DecisionBranch {
  condition: string;
  triggerEvidence: string;
  recommendedAction: string;
  planImpact: "proceed" | "pause" | "adapt" | "stop";
}

export interface CommunicationDraft {
  channel: "whatsapp" | "email" | "call_script";
  suggestedTone: string;
  draft: string;
  concernAddressed: string;
  verificationChecklist: string[];
  followUpQuestion?: string;
  alternativeApproach?: string;
}

export interface MomentumPlanStep {
  id: string;
  sequence: number;
  title: string;
  category: StepCategory;
  purpose: string;
  instructions: string;
  rationale: string;
  supportingEvidence: string[];
  timing: string;
  prerequisites: string[];
  expectedOutcome: string;
  completionCriteria: string;
  risksOrUnknowns: string[];
  contingency: string;
  status: StepStatus;
  blockedReason?: string;
  completedAt?: string;
  statusUpdatedAt?: string;
  communicationDraft?: CommunicationDraft;
  decisionBranches?: DecisionBranch[];
}

export interface LeadMomentumPlan {
  planId: string;
  leadId: LeadId;
  planVersion: number;
  planTitle: string;
  objective: PlanningObjective;
  objectiveLabel: string;
  communicationFormat: CommunicationFormat;
  additionalInstructions?: string;
  leadSituationSummary: string;
  strategyRationale: string;
  assumptions: string[];
  unknowns: string[];
  successDefinition: string;
  createdAt: string;
  updatedAt: string;
  steps: MomentumPlanStep[];
  meta?: {
    provider: "google-gemini" | "groq" | "offline-heuristic" | "seeded-fixture";
    model: string | null;
    mode: "live" | "fallback" | "fixture";
    fallbackUsed: boolean;
    secondaryUsed?: boolean;
    primaryFailureReason?: string;
    latencyMs: number;
    message?: string;
  };
}

