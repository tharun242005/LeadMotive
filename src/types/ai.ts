// ============================================================================
// SignalDesk — AI Response Types
// ============================================================================

import type {
  CustomerIntent,
  ExtractedRequirement,
  ExtractedObjection,
  SuggestedAction,
  TimelineTouchpoint,
  RehearsalFeedback,
} from "./lead";

// ---------------------------------------------------------------------------
// API Request / Response shapes
// ---------------------------------------------------------------------------

/** POST /api/leads/analyze — request body. */
export interface AnalyzeLeadRequest {
  name: string;
  location: string;
  propertyRequirement: string;
  budget: number;
  buyingTimeline: string;
  customerMessage: string;
}

/** POST /api/leads/analyze — response body. */
export interface AnalyzeLeadResponse {
  summary: string;
  intent: CustomerIntent;
  intentConfidence: number;
  requirements: ExtractedRequirement[];
  objections: ExtractedObjection[];
  recommendedAction: SuggestedAction;
  suggestedResponse: string;
  timeline: TimelineTouchpoint[];
}

/** POST /api/leads/chat — request body. */
export interface ChatRequest {
  /** The user's follow-up question. */
  message: string;
  /** Lead context so the AI has grounding. */
  leadContext: {
    name: string;
    location: string;
    propertyRequirement: string;
    budget: number;
    buyingTimeline: string;
    customerMessage: string;
    analysisSummary: string | null;
  };
  /** Previous conversation messages for continuity. */
  history: Array<{ role: "user" | "assistant"; content: string }>;
}

/** POST /api/leads/chat — response body. */
export interface ChatResponse {
  reply: string;
}

/** POST /api/leads/rehearsal — request body. */
export interface RehearsalRequest {
  /** The salesperson's latest response in the roleplay. */
  message: string;
  /** Lead context for realistic objections. */
  leadContext: {
    name: string;
    location: string;
    propertyRequirement: string;
    budget: number;
    buyingTimeline: string;
    customerMessage: string;
    objections: ExtractedObjection[];
  };
  /** Previous rehearsal messages. */
  history: Array<{ role: "salesperson" | "customer"; content: string }>;
  /** Whether to include coaching feedback. */
  includeFeedback: boolean;
}

/** POST /api/leads/rehearsal — response body. */
export interface RehearsalResponse {
  /** The AI customer's reply. */
  customerReply: string;
  /** Coaching feedback, if requested. */
  feedback: RehearsalFeedback | null;
}

/** Shared API error shape. */
export interface ApiError {
  error: string;
  details?: string;
}
