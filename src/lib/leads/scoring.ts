// ============================================================================
// SignalDesk — Authoritative Deterministic Lead Priority Scoring (4-Factor Model)
// ============================================================================
//
// The score is computed entirely deterministically from the lead's own fields.
// It does NOT depend on AI analysis — a lead gets an auditable score the moment
// it is created, before any AI call.
//
// Single Authoritative 100-Point Formula (Prompt 3.1):
// 1. Buying timeline            Max 30 pts   (30, 22, 14, 7, 0)
// 2. Explicit buying intent     Max 30 pts   (30, 20, 12, 6, 0)
// 3. Requirement completeness   Max 25 pts   (5 pts x 5 criteria = 25 pts)
// 4. Engagement depth           Max 15 pts   (15, 10, 4, 0 based on conversation depth)
//
// Priority Bands:
//   Hot   75–100   Immediate high-intent action window
//   Warm  45–74    Qualified buyer in active evaluation
//   Cold  0–44     Early research or uncommitted inquiry
//
// NOTE: This score is a rule-based prioritization aid. It is NOT a statistically
// calibrated probability of conversion.
// ============================================================================

import type { PriorityScore, PriorityFactor, PriorityBand, BuyingTimeline } from "@/types/lead";

// ---------------------------------------------------------------------------
// Factor 1: Buying Timeline (Max 30 pts)
// ---------------------------------------------------------------------------
// A. Buying timeline — maximum 30 points:
// - Within 30 days: 30.
// - Within 90 days: 22.
// - Within 180 days: 14.
// - Beyond 180 days: 7.
// - Unknown: 0.
export function scoreTimeline(timeline: BuyingTimeline): PriorityFactor {
  const maxPoints = 30;
  let points = 0;
  let reason = "";

  switch (timeline) {
    case "immediate":
      points = 30;
      reason = "Within 30 days — critical transaction window (+30)";
      break;
    case "1_to_3_months":
      points = 22;
      reason = "Within 90 days — active purchasing evaluation (+22)";
      break;
    case "3_to_6_months":
      points = 14;
      reason = "Within 180 days — mid-term decision horizon (+14)";
      break;
    case "6_to_12_months":
      points = 7;
      reason = "Beyond 180 days (6–12 months) — extended planning (+7)";
      break;
    case "beyond_12_months":
      points = 7;
      reason = "Beyond 180 days (>12 months) — exploratory horizon (+7)";
      break;
    case "not_specified":
    default:
      points = 0;
      reason = "Timeline unknown — requires qualification (+0)";
      break;
  }

  return {
    name: "timeline",
    label: "Buying Timeline",
    points,
    maxPoints,
    reason,
  };
}

// ---------------------------------------------------------------------------
// Factor 2: Explicit Buying Intent (Max 30 pts)
// ---------------------------------------------------------------------------
// B. Explicit buying intent — maximum 30 points:
// - Explicit visit or decision/next-step request: 30.
// - Specific pricing, availability, financing or total-cost question: 20.
// - Explicit comparison between options: 12.
// - Broad initial research: 6.
// - Unclear: 0.
export function scoreIntent(message: string, budget?: number): PriorityFactor {
  const maxPoints = 30;
  const lowerMsg = (message || "").toLowerCase().trim();
  let points = 0;
  let reason = "";

  // 1. Explicit visit or decision/next-step request (30 pts)
  const visitOrClosingSignals = [
    "site visit", "visit", "schedule a visit", "arrange a site visit", "tour",
    "ready to buy", "ready to close", "sanctioned", "pre-approved", "preapproved",
    "token", "booking amount", "advance", "finalize", "finalise", "all cash",
    "register", "ready to move", "cheque ready", "visited two projects already",
  ];

  // 2. Specific pricing, availability, financing or total-cost question (20 pts)
  const pricingOrFinancingSignals = [
    "price", "pricing", "cost", "total cost", "maintenance", "loan", "financing",
    "pre-approved", "sanctioned", "available", "availability", "rate per sqft",
    "sqft rate", "emi", "payment plan", "bank tie-up", "bank tie-ups", "hidden cost",
    "registration charges", "gst", "cauvery", "possession date", "handover",
  ];

  // 3. Explicit comparison between options (12 pts)
  const comparisonSignals = [
    "comparing", "compare", "between", "shortlisted", "shortlist", "evaluating",
    "versus", "vs", "competitor project",
  ];

  // 4. Broad initial research (6 pts)
  const researchSignals = [
    "looking for", "interested in", "inquiry", "enquiry", "callback", "call me",
    "call back", "reach out", "connect on call", "phone number", "general information",
    "starting research", "exploring",
  ];

  if (visitOrClosingSignals.some((sig) => lowerMsg.includes(sig))) {
    points = 30;
    reason = "Explicit visit request or decision/next-step signal (+30)";
  } else if (pricingOrFinancingSignals.some((sig) => lowerMsg.includes(sig)) || (budget && budget > 0 && lowerMsg.includes("?"))) {
    points = 20;
    reason = "Specific pricing, availability, financing or total-cost question (+20)";
  } else if (comparisonSignals.some((sig) => lowerMsg.includes(sig))) {
    points = 12;
    reason = "Explicit comparison between property options (+12)";
  } else if (researchSignals.some((sig) => lowerMsg.includes(sig)) || lowerMsg.length >= 10) {
    points = 6;
    reason = "Broad initial research enquiry (+6)";
  } else {
    points = 0;
    reason = "Unclear buying intent (+0)";
  }

  return {
    name: "intent",
    label: "Explicit Buying Intent",
    points,
    maxPoints,
    reason,
  };
}

// ---------------------------------------------------------------------------
// Factor 3: Requirement Completeness (Max 25 pts)
// ---------------------------------------------------------------------------
// C. Requirement completeness — maximum 25 points:
// - Known location: 5.
// - Clear property requirement: 5.
// - Known budget: 5.
// - Known buying timeline: 5.
// - At least one concrete customer need or constraint: 5.
export function scoreRequirementCompleteness(
  location: string,
  requirement: string,
  budget: number,
  timeline: BuyingTimeline,
  message: string,
): PriorityFactor {
  const maxPoints = 25;
  let points = 0;
  const reasons: string[] = [];

  const loc = (location || "").trim();
  const req = (requirement || "").trim();
  const lowerReq = req.toLowerCase();
  const lowerMsg = (message || "").toLowerCase();

  // 1. Known location: 5
  if (loc.length > 0 && loc.toLowerCase() !== "undecided") {
    points += 5;
    reasons.push("Known location (+5)");
  } else {
    reasons.push("Location undecided (+0)");
  }

  // 2. Clear property requirement: 5
  if (req.length > 0) {
    points += 5;
    reasons.push("Clear property requirement (+5)");
  } else {
    reasons.push("Property requirement unstated (+0)");
  }

  // 3. Known budget: 5
  if (budget > 0) {
    points += 5;
    reasons.push("Known budget (+5)");
  } else {
    reasons.push("Budget unstated (+0)");
  }

  // 4. Known buying timeline: 5
  if (timeline && timeline !== "not_specified") {
    points += 5;
    reasons.push("Known buying timeline (+5)");
  } else {
    reasons.push("Timeline unstated (+0)");
  }

  // 5. At least one concrete customer need or constraint: 5
  const concreteConstraints = [
    "school", "kids", "children", "parents", "elderly", "parking", "car parking",
    "vaastu", "vastu", "facing", "high floor", "gated community", "gated",
    "rera", "a-khata", "a khata", "ready to move", "commute", "itpl", "tech park",
    "sq ft", "sqft", "sft", "balcony", "east", "north", "budget under", "all-inclusive",
    "cauvery", "possession",
  ];
  const hasConstraint = concreteConstraints.some(
    (c) => lowerReq.includes(c) || lowerMsg.includes(c)
  );

  if (hasConstraint) {
    points += 5;
    reasons.push("Concrete customer need/constraint identified (+5)");
  } else {
    reasons.push("No concrete constraint identified (+0)");
  }

  return {
    name: "requirementCompleteness",
    label: "Requirement Completeness",
    points,
    maxPoints,
    reason: reasons.join("; "),
  };
}

// ---------------------------------------------------------------------------
// Factor 4: Engagement Depth (Max 15 pts)
// ---------------------------------------------------------------------------
// D. Engagement depth — maximum 15 points:
// - Three or more meaningful customer turns in a supplied conversation: 15.
// - Two meaningful turns: 10.
// - One substantive initial message: 4.
// - No usable message: 0.
// Engagement depth is based on the available conversation depth, not the presence
// of a specific visit request. This avoids counting the same buying-intent signal twice.
export function scoreEngagementDepth(
  message: string,
  conversationTurns?: number,
): PriorityFactor {
  const maxPoints = 15;
  const msg = (message || "").trim();
  let points = 0;
  let reason = "";

  if (typeof conversationTurns === "number" && conversationTurns >= 3) {
    points = 15;
    reason = "Three or more meaningful customer turns in conversation (+15)";
  } else if (typeof conversationTurns === "number" && conversationTurns === 2) {
    points = 10;
    reason = "Two meaningful customer turns in conversation (+10)";
  } else if (msg.length >= 20 || (typeof conversationTurns === "number" && conversationTurns === 1)) {
    points = 4;
    reason = "One substantive initial message (+4)";
  } else if (msg.length > 0) {
    points = 2;
    reason = "Brief non-substantive message (<20 chars) (+2)";
  } else {
    points = 0;
    reason = "No usable message (+0)";
  }

  return {
    name: "engagementDepth",
    label: "Engagement Depth",
    points,
    maxPoints,
    reason,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function bandFromScore(total: number): PriorityBand {
  if (total >= 75) return "hot";
  if (total >= 45) return "warm";
  return "cold";
}

/**
 * Compute the 4-factor deterministic priority score for a lead.
 * Pure function: deterministic, instant (0ms), reproducible.
 */
export function computePriority(lead: {
  budget: number;
  buyingTimeline: BuyingTimeline;
  customerMessage: string;
  location: string;
  propertyRequirement: string;
  conversationTurns?: number;
}): PriorityScore {
  const factors: PriorityFactor[] = [
    scoreTimeline(lead.buyingTimeline),
    scoreIntent(lead.customerMessage, lead.budget),
    scoreRequirementCompleteness(
      lead.location,
      lead.propertyRequirement,
      lead.budget,
      lead.buyingTimeline,
      lead.customerMessage,
    ),
    scoreEngagementDepth(lead.customerMessage, lead.conversationTurns),
  ];

  const total = Math.max(0, Math.min(100, factors.reduce((sum, f) => sum + f.points, 0)));
  const band = bandFromScore(total);

  return { total, band, factors };
}

/**
 * Priority band colors and tokens for UI badges.
 */
export function priorityBandColor(band: PriorityBand): {
  bg: string;
  text: string;
  dot: string;
  border: string;
  label: string;
} {
  switch (band) {
    case "hot":
      return {
        bg: "rgba(239, 68, 68, 0.12)",
        text: "var(--sd-danger, #ef4444)",
        dot: "#ef4444",
        border: "rgba(239, 68, 68, 0.28)",
        label: "Hot",
      };
    case "warm":
      return {
        bg: "rgba(245, 158, 11, 0.12)",
        text: "var(--sd-warm, #f59e0b)",
        dot: "#f59e0b",
        border: "rgba(245, 158, 11, 0.28)",
        label: "Warm",
      };
    case "cold":
      return {
        bg: "rgba(100, 116, 139, 0.12)",
        text: "var(--sd-subtle, #64748b)",
        dot: "#64748b",
        border: "rgba(100, 116, 139, 0.28)",
        label: "Cold",
      };
  }
}
