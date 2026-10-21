// ============================================================================
// SignalDesk — AI Response Validation Schemas
// ============================================================================
//
// Runtime validation for AI model responses before they reach the UI.
// Ensures the AI output matches our type contracts.
// ============================================================================

import type { AnalyzeLeadResponse, RehearsalResponse } from "@/types/ai";
import type { CustomerIntent } from "@/types/lead";

const VALID_INTENTS: CustomerIntent[] = [
  "ready_to_buy", "actively_searching", "comparing_options",
  "early_research", "seeking_information", "callback_request", "unclear",
];

const VALID_ACTION_TYPES = [
  "call", "whatsapp", "email", "site_visit", "follow_up", "share_info",
];

const VALID_CHANNELS = ["call", "whatsapp", "email", "site_visit"];

/**
 * Validate and sanitise an AI analysis response.
 * Returns a cleaned response or throws with a descriptive error.
 */
export function validateAnalysisResponse(raw: unknown): AnalyzeLeadResponse {
  if (!raw || typeof raw !== "object") {
    throw new Error("AI response is not an object");
  }

  const r = raw as Record<string, unknown>;

  // Required string fields
  const summary = expectString(r, "summary");
  const suggestedResponse = expectString(r, "suggestedResponse");

  // Intent
  const intent = VALID_INTENTS.includes(r.intent as CustomerIntent)
    ? (r.intent as CustomerIntent)
    : "unclear";

  // Confidence
  const intentConfidence = typeof r.intentConfidence === "number"
    ? Math.max(0, Math.min(1, r.intentConfidence))
    : 0.5;

  // Requirements array
  const requirements = Array.isArray(r.requirements)
    ? r.requirements
        .filter((req: unknown) => req && typeof req === "object" && typeof (req as Record<string, unknown>).label === "string")
        .map((req: unknown) => {
          const rq = req as Record<string, unknown>;
          return {
            label: String(rq.label),
            confidence: rq.confidence === "inferred" ? "inferred" as const : "explicit" as const,
          };
        })
    : [];

  // Objections array
  const objections = Array.isArray(r.objections)
    ? r.objections
        .filter((obj: unknown) => obj && typeof obj === "object" && typeof (obj as Record<string, unknown>).label === "string")
        .map((obj: unknown) => {
          const ob = obj as Record<string, unknown>;
          const severity = ["high", "medium", "low"].includes(String(ob.severity))
            ? (String(ob.severity) as "high" | "medium" | "low")
            : "medium";
          return { label: String(ob.label), severity };
        })
    : [];

  // Recommended action
  const rawAction = r.recommendedAction as Record<string, unknown> | undefined;
  const recommendedAction = {
    type: rawAction && VALID_ACTION_TYPES.includes(String(rawAction.type))
      ? (String(rawAction.type) as AnalyzeLeadResponse["recommendedAction"]["type"])
      : "follow_up" as const,
    description: rawAction ? String(rawAction.description || "Follow up with the lead") : "Follow up with the lead",
    timeframe: rawAction ? String(rawAction.timeframe || "Within 24 hours") : "Within 24 hours",
  };

  // Timeline
  const timeline = Array.isArray(r.timeline)
    ? r.timeline
        .filter((tp: unknown) => tp && typeof tp === "object")
        .map((tp: unknown) => {
          const t = tp as Record<string, unknown>;
          return {
            dayOffset: typeof t.dayOffset === "number" ? t.dayOffset : 0,
            action: String(t.action || "Follow up"),
            channel: VALID_CHANNELS.includes(String(t.channel))
              ? (String(t.channel) as "call" | "whatsapp" | "email" | "site_visit")
              : "call" as const,
            completed: false,
          };
        })
    : [];

  return {
    summary,
    intent,
    intentConfidence,
    requirements,
    objections,
    recommendedAction,
    suggestedResponse,
    timeline,
  };
}

/**
 * Validate a rehearsal response.
 */
export function validateRehearsalResponse(raw: unknown): RehearsalResponse {
  if (!raw || typeof raw !== "object") {
    throw new Error("Rehearsal response is not an object");
  }

  const r = raw as Record<string, unknown>;
  const customerReply = expectString(r, "customerReply");

  let feedback = null;
  if (r.feedback && typeof r.feedback === "object") {
    const f = r.feedback as Record<string, unknown>;
    feedback = {
      score: typeof f.score === "number" ? Math.max(1, Math.min(10, f.score)) : 5,
      strengths: Array.isArray(f.strengths) ? f.strengths.map(String) : [],
      improvements: Array.isArray(f.improvements) ? f.improvements.map(String) : [],
      suggestedAlternative: typeof f.suggestedAlternative === "string" ? f.suggestedAlternative : "",
    };
  }

  return { customerReply, feedback };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function expectString(obj: Record<string, unknown>, key: string): string {
  const val = obj[key];
  if (typeof val !== "string" || val.trim().length === 0) {
    throw new Error(`Missing or empty required field: ${key}`);
  }
  return val.trim();
}
