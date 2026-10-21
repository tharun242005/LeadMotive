// ============================================================================
// SignalDesk — AI Response Types & Metadata Contract
// ============================================================================

import type {
  CustomerIntent,
  ExtractedRequirement,
  ExtractedObjection,
  SuggestedAction,
  TimelineTouchpoint,
  RehearsalFeedback,
  LeadMomentumPlan,
  PlanningObjective,
  CommunicationFormat,
  MomentumPlanStep,
} from "./lead";

// ---------------------------------------------------------------------------
// Typed Provider Metadata
// ---------------------------------------------------------------------------
export interface AIMetadata {
  /** The actual provider used (e.g. "google-gemini", "offline-heuristic", or "seeded-fixture"). */
  provider: "google-gemini" | "offline-heuristic" | "seeded-fixture";
  /** The actual model used if live, or null if heuristic. */
  model: string | null;
  /** Whether this was a verified live provider response or an offline fallback. */
  mode: "live" | "fallback" | "fixture";
  /** Explicit flag confirming if fallback was triggered. */
  fallbackUsed: boolean;
  /** Server-measured execution latency in milliseconds. */
  latencyMs: number;
  /** Optional informational or sanitised message. */
  message?: string;
}

// ---------------------------------------------------------------------------
// API Request / Response shapes
// ---------------------------------------------------------------------------

/** POST /api/leads/plan — request body. */
export interface PlanRequest {
  lead: {
    id: string;
    name: string;
    location: string;
    propertyRequirement: string;
    budget: number;
    buyingTimeline: string;
    customerMessage: string;
    priority?: {
      total: number;
      band: string;
    };
    analysis?: {
      summary?: string;
      intent?: string;
      requirements?: Array<{ label: string }>;
      objections?: Array<{ label: string; severity?: string }>;
    } | null;
  };
  objective: PlanningObjective;
  communicationFormat: CommunicationFormat;
  additionalInstructions?: string;
  isAdaptation?: boolean;
  previousPlan?: {
    planId: string;
    planVersion: number;
    completedSteps: MomentumPlanStep[];
    remainingSteps: MomentumPlanStep[];
    adaptationReason?: string;
  };
}

/** POST /api/leads/plan — response body. */
export interface PlanResponse extends Omit<LeadMomentumPlan, "meta"> {
  meta: AIMetadata;
}

/** POST /api/leads/analyze — request body. */
export interface AnalyzeLeadRequest {
  name: string;
  location: string;
  propertyRequirement: string;
  budget: number;
  buyingTimeline: string;
  customerMessage: string;
}

export type AIErrorCode =
  | "MISSING_API_CONFIGURATION"
  | "INVALID_INPUT"
  | "PROVIDER_QUOTA_EXCEEDED"
  | "PROVIDER_NETWORK_FAILURE"
  | "MALFORMED_MODEL_OUTPUT"
  | "UNEXPECTED_SERVER_ERROR";

export interface AIErrorResponse {
  error: string;
  code: AIErrorCode;
  status: number;
  meta: AIMetadata;
  details?: string;
}

/** POST /api/leads/analyze — response body. */
export interface AnalyzeLeadResponse {
  summary: string;
  intent: CustomerIntent;
  customerIntent?: {
    category: CustomerIntent;
    explanation: string;
  };
  intentConfidence: number;
  requirements: ExtractedRequirement[];
  keyRequirements?: ExtractedRequirement[];
  objections: ExtractedObjection[];
  recommendedAction: SuggestedAction;
  recommendedNextAction?: SuggestedAction;
  suggestedResponse: string;
  timeline: TimelineTouchpoint[];
  missingInformation?: string[];
  evidence?: Array<{
    field: string;
    quote: string;
    verified: boolean;
  }>;
  uncertainties?: string[];
  meta: AIMetadata;
}

/** POST /api/leads/chat — request body. */
export interface ChatRequest {
  /** The user's follow-up question. */
  message: string;
  /** Lead context so the AI has grounding. */
  leadContext: {
    id?: string;
    name: string;
    location: string;
    propertyRequirement: string;
    budget: number;
    buyingTimeline: string;
    customerMessage: string;
    priority?: {
      total: number;
      band: string;
    };
    analysis?: {
      summary?: string;
      intent?: string;
      requirements?: Array<{ label: string }>;
      objections?: Array<{ label: string; severity?: string; recommendedHandling?: string }>;
      recommendedAction?: { description: string; timeframe: string };
      suggestedResponse?: string;
      missingInformation?: string[];
    } | null;
    analysisSummary?: string | null;
  };
  /** Previous conversation messages for continuity. */
  history: Array<{ role: "user" | "assistant"; content: string }>;
}

/** POST /api/leads/chat — response body. */
export interface ChatResponse {
  answer: string;
  /** Backwards compatibility alias */
  reply?: string;
  supportingEvidence?: string[];
  uncertainties?: string[];
  suggestedNextQuestion?: string;
  meta: AIMetadata;
}

export type RehearsalMode = "roleplay" | "coach";

/** POST /api/leads/rehearsal — request body. */
export interface RehearsalRequest {
  /** Mode: "roleplay" (buyer simulation) or "coach" (debrief feedback). Defaults to "roleplay". */
  mode?: RehearsalMode;
  /** The salesperson's latest response in the roleplay, or empty if starting scenario. */
  message?: string;
  /** The target objection being rehearsed. */
  targetObjection?: {
    label: string;
    severity?: string;
    evidenceQuote?: string;
    recommendedHandling?: string;
  };
  /** Strategic objective for this practice session. */
  objective?: string;
  /** Lead context for realistic objections. */
  leadContext: {
    id?: string;
    name: string;
    location: string;
    propertyRequirement: string;
    budget: number;
    buyingTimeline: string;
    customerMessage: string;
    objections: ExtractedObjection[];
    analysis?: {
      summary?: string;
      intent?: string;
    } | null;
  };
  /** Previous rehearsal messages. */
  history: Array<{ role: "salesperson" | "customer"; content: string }>;
  /** Whether to include coaching feedback (for backwards compatibility). */
  includeFeedback?: boolean;
}

/** POST /api/leads/rehearsal — response body. */
export interface RehearsalResponse {
  /** Mode of response. */
  mode?: RehearsalMode;
  /** The AI customer's reply. */
  customerReply: string;
  /** Coaching feedback, if in coach mode or requested. */
  feedback: RehearsalFeedback | null;
  meta: AIMetadata;
}

/** GET /api/leads/diagnostics — response body. */
export interface DiagnosticsResponse {
  configured: boolean;
  model: string;
  tested: boolean;
  status: "ready" | "unconfigured" | "error";
  latencyMs?: number;
  message: string;
}

/** Shared API error shape. */
export interface ApiError {
  error: string;
  details?: string;
  meta?: AIMetadata;
}
