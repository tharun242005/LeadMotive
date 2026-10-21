// ============================================================================
// SignalDesk — Deterministic Lead Priority Scoring
// ============================================================================
//
// The score is computed entirely on the client from the lead's own fields.
// It does NOT depend on AI analysis — a lead gets a score the moment it is
// created, before any AI call. This keeps scoring transparent, debuggable
// and explainable in the interview.
//
// Total: 0–100 points, divided into five factors.
//
// Factor                   Max pts   Logic
// ─────────────────────────────────────────────────────────────
// Budget specificity        20       Has a concrete number vs. vague
// Buying timeline           25       Immediate scores highest
// Message quality           20       Length & detail of customer message
// Location clarity          15       Recognised Bengaluru locality
// Requirement specificity   20       Mentions BHK, type, amenities, etc.
//
// Band thresholds:
//   Hot  ≥ 70
//   Warm ≥ 40
//   Cold < 40
// ============================================================================

import type { Lead, PriorityScore, PriorityFactor, PriorityBand, BuyingTimeline } from "@/types/lead";

// ---------------------------------------------------------------------------
// Known Bengaluru localities (for location scoring)
// ---------------------------------------------------------------------------
const BENGALURU_LOCALITIES = new Set([
  "whitefield", "sarjapur road", "sarjapur", "hebbal", "yelahanka",
  "hennur", "electronic city", "hsr layout", "koramangala", "indiranagar",
  "jayanagar", "jp nagar", "bannerghatta road", "bannerghatta",
  "marathahalli", "bellandur", "devanahalli", "thanisandra", "bagalur",
  "kanakapura road", "mysore road", "tumkur road", "rajajinagar",
  "malleshwaram", "basavanagudi", "btm layout", "bommanahalli",
  "kr puram", "mahadevapura", "varthur", "kadugodi", "hoskote",
  "doddaballapur", "north bengaluru", "south bengaluru",
  "east bengaluru", "west bengaluru", "central bengaluru",
]);

// ---------------------------------------------------------------------------
// Scoring functions
// ---------------------------------------------------------------------------

function scoreBudget(budget: number): PriorityFactor {
  const maxPoints = 20;
  let points: number;
  let reason: string;

  if (budget > 0) {
    // Higher budgets indicate more serious buyers in Bengaluru market
    if (budget >= 1_50_00_000) {        // ≥ 1.5 Cr
      points = 20;
      reason = "Premium budget (≥ ₹1.5 Cr) — high-value lead";
    } else if (budget >= 75_00_000) {    // ≥ 75 L
      points = 16;
      reason = "Strong budget (₹75 L – ₹1.5 Cr)";
    } else if (budget >= 40_00_000) {    // ≥ 40 L
      points = 12;
      reason = "Mid-range budget (₹40 L – ₹75 L)";
    } else {
      points = 8;
      reason = "Budget specified (< ₹40 L)";
    }
  } else {
    points = 3;
    reason = "Budget not specified — needs qualification";
  }

  return { name: "budget", label: "Budget Specificity", points, maxPoints, reason };
}

function scoreTimeline(timeline: BuyingTimeline): PriorityFactor {
  const maxPoints = 25;
  const map: Record<BuyingTimeline, { points: number; reason: string }> = {
    immediate:        { points: 25, reason: "Ready to buy now — highest urgency" },
    "1_to_3_months":  { points: 20, reason: "Active buyer — 1–3 month timeline" },
    "3_to_6_months":  { points: 14, reason: "Warm prospect — 3–6 month horizon" },
    "6_to_12_months": { points: 8,  reason: "Early-stage — 6–12 months out" },
    beyond_12_months: { points: 4,  reason: "Long-term researcher — 12+ months" },
    not_specified:    { points: 6,  reason: "Timeline unclear — needs clarification" },
  };

  const { points, reason } = map[timeline];
  return { name: "timeline", label: "Buying Timeline", points, maxPoints, reason };
}

function scoreMessage(message: string): PriorityFactor {
  const maxPoints = 20;
  const trimmed = message.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;

  let points: number;
  let reason: string;

  if (wordCount >= 50) {
    points = 20;
    reason = `Detailed message (${wordCount} words) — high engagement`;
  } else if (wordCount >= 25) {
    points = 15;
    reason = `Good detail (${wordCount} words) — clear interest`;
  } else if (wordCount >= 10) {
    points = 10;
    reason = `Brief message (${wordCount} words) — some context`;
  } else if (wordCount > 0) {
    points = 5;
    reason = `Very short (${wordCount} words) — limited context`;
  } else {
    points = 0;
    reason = "No message provided";
  }

  return { name: "message", label: "Message Quality", points, maxPoints, reason };
}

function scoreLocation(location: string): PriorityFactor {
  const maxPoints = 15;
  const normalised = location.trim().toLowerCase();

  if (BENGALURU_LOCALITIES.has(normalised)) {
    return {
      name: "location",
      label: "Location Clarity",
      points: 15,
      maxPoints,
      reason: `Recognised locality: ${location}`,
    };
  }

  // Partial match — location contains a known locality name
  for (const loc of BENGALURU_LOCALITIES) {
    if (normalised.includes(loc) || loc.includes(normalised)) {
      return {
        name: "location",
        label: "Location Clarity",
        points: 10,
        maxPoints,
        reason: `Partial match: ${location}`,
      };
    }
  }

  if (normalised.length > 0) {
    return {
      name: "location",
      label: "Location Clarity",
      points: 5,
      maxPoints,
      reason: `Unrecognised area: ${location}`,
    };
  }

  return {
    name: "location",
    label: "Location Clarity",
    points: 0,
    maxPoints,
    reason: "No location provided",
  };
}

function scoreRequirement(requirement: string): PriorityFactor {
  const maxPoints = 20;
  const lower = requirement.toLowerCase();
  let points = 0;
  const hits: string[] = [];

  // Check for BHK mention
  if (/\d\s*bhk/i.test(lower)) {
    points += 6;
    hits.push("BHK type");
  }

  // Property type keywords
  const types = ["apartment", "flat", "villa", "plot", "penthouse", "duplex", "row house", "independent house"];
  for (const t of types) {
    if (lower.includes(t)) {
      points += 4;
      hits.push(t);
      break;
    }
  }

  // Amenity / preference keywords
  const amenities = ["gated", "swimming", "gym", "parking", "garden", "club", "furnished", "vastu", "east facing", "corner"];
  for (const a of amenities) {
    if (lower.includes(a)) {
      points += 3;
      hits.push(a);
      if (points >= maxPoints) break;
    }
  }

  // Size mention (sq ft)
  if (/\d+\s*(sq\.?\s*ft|sft|square\s*feet)/i.test(lower)) {
    points += 4;
    hits.push("area specified");
  }

  points = Math.min(points, maxPoints);
  const reason = hits.length > 0
    ? `Mentions: ${hits.join(", ")}`
    : "Vague requirement — needs clarification";

  if (points === 0 && requirement.trim().length > 0) {
    points = 3; // At least something was written
  }

  return { name: "requirement", label: "Requirement Specificity", points, maxPoints, reason };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

function bandFromScore(total: number): PriorityBand {
  if (total >= 70) return "hot";
  if (total >= 40) return "warm";
  return "cold";
}

/**
 * Compute a deterministic priority score for a lead.
 * This function is pure — no side effects, no AI calls.
 */
export function computePriority(lead: Pick<Lead, "budget" | "buyingTimeline" | "customerMessage" | "location" | "propertyRequirement">): PriorityScore {
  const factors: PriorityFactor[] = [
    scoreBudget(lead.budget),
    scoreTimeline(lead.buyingTimeline),
    scoreMessage(lead.customerMessage),
    scoreLocation(lead.location),
    scoreRequirement(lead.propertyRequirement),
  ];

  const total = Math.min(100, factors.reduce((sum, f) => sum + f.points, 0));
  return { total, band: bandFromScore(total), factors };
}

/**
 * Return the colour scheme for a priority band.
 * Used by UI components for consistent badge/indicator colours.
 */
export function priorityBandColor(band: PriorityBand): {
  bg: string;
  text: string;
  dot: string;
  border: string;
} {
  switch (band) {
    case "hot":
      return {
        bg: "rgba(239, 68, 68, 0.10)",
        text: "#ef4444",
        dot: "#ef4444",
        border: "rgba(239, 68, 68, 0.25)",
      };
    case "warm":
      return {
        bg: "rgba(245, 158, 11, 0.10)",
        text: "#f59e0b",
        dot: "#f59e0b",
        border: "rgba(245, 158, 11, 0.25)",
      };
    case "cold":
      return {
        bg: "rgba(100, 116, 139, 0.10)",
        text: "#64748b",
        dot: "#64748b",
        border: "rgba(100, 116, 139, 0.25)",
      };
  }
}
