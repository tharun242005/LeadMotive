// ============================================================================
// SignalDesk — Lead Domain Types
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
}

/** A concern or objection extracted from the customer message. */
export interface ExtractedObjection {
  /** Short label, e.g. "Budget constraint", "Possession delay". */
  label: string;
  /** Severity from the salesperson's perspective. */
  severity: "high" | "medium" | "low";
}

/** Suggested next action for the salesperson. */
export interface SuggestedAction {
  /** Action type. */
  type: "call" | "whatsapp" | "email" | "site_visit" | "follow_up" | "share_info";
  /** Brief description of what to do. */
  description: string;
  /** Suggested timeframe, e.g. "Within 2 hours", "Tomorrow morning". */
  timeframe: string;
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
  /** Confidence in the intent classification (0–1). */
  intentConfidence: number;
  /** Key requirements extracted from the customer message. */
  requirements: ExtractedRequirement[];
  /** Objections or concerns. */
  objections: ExtractedObjection[];
  /** Recommended next action. */
  recommendedAction: SuggestedAction;
  /** Suggested response to the customer. */
  suggestedResponse: string;
  /** Deal velocity timeline — touchpoints over the next few weeks. */
  timeline: TimelineTouchpoint[];
  /** Timestamp when analysis was generated. */
  analyzedAt: string;
  /** Whether this analysis is seeded fixture data. */
  isSeeded: boolean;
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

/** AI coaching feedback on a rehearsal response. */
export interface RehearsalFeedback {
  score: number;         // 1–10
  strengths: string[];
  improvements: string[];
  suggestedAlternative: string;
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
}
