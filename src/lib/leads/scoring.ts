// ============================================================================
// LeadMotive — Authoritative Deterministic Lead Priority Scoring (4-Factor Model)
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
//   Act Now    75–100   Immediate high-intent action window (internal: "hot")
//   Follow Up  45–74    Qualified buyer in active evaluation (internal: "warm")
//   Nurture    0–44     Early research or uncommitted inquiry (internal: "cold")
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
 * Canonical user-facing display labels for priority bands.
 * Maps internal enum keys ("hot" | "warm" | "cold") to action-oriented terminology:
 * - 75–100: "Act Now"
 * - 45–74: "Follow Up"
 * - 0–44: "Nurture"
 *
 * NOTE: These labels represent rule-based priority heuristics, not a statistical conversion guarantee.
 */
export const PRIORITY_BAND_LABELS: Record<PriorityBand, string> = {
  hot: "Act Now",
  warm: "Follow Up",
  cold: "Nurture",
} as const;

/**
 * Canonical user-facing display label with score:
 * e.g., formatPriorityDisplay("hot", 89) -> "Act Now · 89"
 */
export function formatPriorityDisplay(band: PriorityBand, score: number): string {
  return `${PRIORITY_BAND_LABELS[band]} · ${score}`;
}

/**
 * Safe presentation-layer normalisation for legacy assistant-generated priority text.
 * Replaces obsolete priority terminology ("Hot", "Warm", "Cold") in assistant explanations
 * with canonical labels ("Act Now", "Follow Up", "Nurture").
 *
 * MUST ONLY be applied to assistant-authored text, NEVER to user messages, raw customer inquiries,
 * or unrelated content.
 */
export function normalizeAssistantPriorityText(text: string): string {
  if (!text) return text;

  let result = text;

  // 1. Full threshold sentence patterns
  result = result.replace(
    /(?:A score of )?75\+\s+earns\s+\*?\*?Hot\*?\*?\s+status[;,]?\s*45[–-]74\s+are\s+\*?\*?Warm\*?\*?[.,]?/gi,
    "Scores from 75–100 are classified as **Act Now**, scores from 45–74 as **Follow Up**, and scores from 0–44 as **Nurture**."
  );

  result = result.replace(
    /A score of 75\+\s+earns\s+\*?\*?Act Now\*?\*?\s+status for immediate engagement\.\s*Scores between 45[–-]74 are\s+\*?\*?Follow Up\*?\*?[^.]*\.\s*Scores of 0[–-]44 are\s+\*?\*?Nurture\*?\*?[^.]*\./gi,
    "Scores from 75–100 are classified as **Act Now**, scores from 45–74 as **Follow Up**, and scores from 0–44 as **Nurture**."
  );

  // 2. Bold uppercase band mentions in assessed statements
  result = result.replace(/\bassessed as \*\*HOT\*\*/g, "assessed as **ACT NOW**");
  result = result.replace(/\bassessed as \*\*WARM\*\*/g, "assessed as **FOLLOW UP**");
  result = result.replace(/\bassessed as \*\*COLD\*\*/g, "assessed as **NURTURE**");

  // 3. Plain assessed as statements
  result = result.replace(/\bassessed as HOT\b/g, "assessed as Act Now");
  result = result.replace(/\bassessed as WARM\b/g, "assessed as Follow Up");
  result = result.replace(/\bassessed as COLD\b/g, "assessed as Nurture");

  // 4. Status mentions (e.g. "**Hot** status", "Hot status")
  result = result.replace(/\b\*\*Hot\*\*\s+status\b/g, "**Act Now** status");
  result = result.replace(/\b\*\*Warm\*\*\s+status\b/g, "**Follow Up** status");
  result = result.replace(/\b\*\*Cold\*\*\s+status\b/g, "**Nurture** status");
  result = result.replace(/\bHot\s+status\b/g, "Act Now status");
  result = result.replace(/\bWarm\s+status\b/g, "Follow Up status");
  result = result.replace(/\bCold\s+status\b/g, "Nurture status");

  // 5. Band with score range e.g., "Hot (75–100)", "Warm (45–74)", "Cold (0–44)"
  result = result.replace(/\bHot\s*\((?:75[–-]100|≥\s*75|75\+)\)/gi, "Act Now (75–100)");
  result = result.replace(/\bWarm\s*\((?:45[–-]74)\)/gi, "Follow Up (45–74)");
  result = result.replace(/\bCold\s*\((?:0[–-]44)\)/gi, "Nurture (0–44)");

  // 6. Priority band is Hot/Warm/Cold
  result = result.replace(/Priority band is \*\*?Hot\*\*?/gi, "Priority band is Act Now");
  result = result.replace(/Priority band is \*\*?Warm\*\*?/gi, "Priority band is Follow Up");
  result = result.replace(/Priority band is \*\*?Cold\*\*?/gi, "Priority band is Nurture");

  // 7. HOT (89) or HOT (89/100) or HOT (score)
  result = result.replace(/\bHOT\s*\((\d{1,3})(?:\/100)?(?:\s*pts)?\)/g, "Act Now · $1");
  result = result.replace(/\bWARM\s*\((\d{1,3})(?:\/100)?(?:\s*pts)?\)/g, "Follow Up · $1");
  result = result.replace(/\bCOLD\s*\((\d{1,3})(?:\/100)?(?:\s*pts)?\)/g, "Nurture · $1");

  // 8. Lead classifications like "Hot lead" in priority context
  result = result.replace(/\bHot lead\b/g, "Act Now lead");
  result = result.replace(/\bWarm lead\b/g, "Follow Up lead");
  result = result.replace(/\bCold lead\b/g, "Nurture lead");

  return result;
}

export interface PriorityStyle {
  label: string;
  badgeClass: string;
  badgeCompactClass: string;
  dotClass: string;
  textClass: string;
  bgClass: string;
  borderClass: string;
  day: { text: string; bg: string; border: string };
  night: { text: string; bg: string; border: string };
}

/**
 * Authoritative Canonical Priority Styles & Color System
 *
 * Act Now:    RED     (Day: #B42318 on #FEE4E2, border #FDA29B / Night: #FF8A80 on #421D22, border #87333A)
 * Follow Up:  AMBER   (Day: #9A4D00 on #FFF0CC, border #F5C26B / Night: #FFC166 on #3B2A15, border #80571D)
 * Nurture:    BLUE    (Day: #175CD3 on #EAF2FF, border #A6C8FF / Night: #8DBBFF on #172D4D, border #355E91)
 */
export const PRIORITY_STYLES: Record<PriorityBand, PriorityStyle> = {
  hot: {
    label: PRIORITY_BAND_LABELS.hot,
    badgeClass: "badge-priority-hot shadow-xs",
    badgeCompactClass: "badge-priority-hot",
    dotClass: "bg-hot",
    textClass: "text-hot",
    bgClass: "bg-hot-fill",
    borderClass: "border-hot-border",
    day: { text: "#B42318", bg: "#FEE4E2", border: "#FDA29B" },
    night: { text: "#FF8A80", bg: "#421D22", border: "#87333A" },
  },
  warm: {
    label: PRIORITY_BAND_LABELS.warm,
    badgeClass: "badge-priority-warm shadow-xs",
    badgeCompactClass: "badge-priority-warm",
    dotClass: "bg-warm",
    textClass: "text-warm",
    bgClass: "bg-warm-fill",
    borderClass: "border-warm-border",
    day: { text: "#9A4D00", bg: "#FFF0CC", border: "#F5C26B" },
    night: { text: "#FFC166", bg: "#3B2A15", border: "#80571D" },
  },
  cold: {
    label: PRIORITY_BAND_LABELS.cold,
    badgeClass: "badge-priority-cold shadow-xs",
    badgeCompactClass: "badge-priority-cold",
    dotClass: "bg-cold",
    textClass: "text-cold",
    bgClass: "bg-cold-fill",
    borderClass: "border-cold-border",
    day: { text: "#175CD3", bg: "#EAF2FF", border: "#A6C8FF" },
    night: { text: "#8DBBFF", bg: "#172D4D", border: "#355E91" },
  },
};

/**
 * Priority band colors, tokens, and canonical labels for UI badges.
 */
export function priorityBandColor(band: PriorityBand): {
  bg: string;
  text: string;
  dot: string;
  border: string;
  label: string;
  day: { text: string; bg: string; border: string };
  night: { text: string; bg: string; border: string };
} {
  const style = PRIORITY_STYLES[band];
  return {
    bg: "var(--lm-" + (band === "hot" ? "hot" : band === "warm" ? "warm" : "cold") + "-bg)",
    text: "var(--lm-" + (band === "hot" ? "hot" : band === "warm" ? "warm" : "cold") + ")",
    dot: "var(--lm-" + (band === "hot" ? "hot" : band === "warm" ? "warm" : "cold") + ")",
    border: "var(--lm-" + (band === "hot" ? "hot" : band === "warm" ? "warm" : "cold") + "-border)",
    label: style.label,
    day: style.day,
    night: style.night,
  };
}
