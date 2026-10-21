import test from "node:test";
import assert from "node:assert/strict";

// Authoritative 4-factor scoring rules per Prompt 3.1
function scoreTimeline(timeline) {
  switch (timeline) {
    case "immediate": return 30; // Within 30 days
    case "1_to_3_months": return 22; // Within 90 days
    case "3_to_6_months": return 14; // Within 180 days
    case "6_to_12_months": return 7; // Beyond 180 days
    case "beyond_12_months": return 7; // Beyond 180 days
    default: return 0; // Unknown
  }
}

function scoreIntent(message, budget) {
  const maxPoints = 30;
  const lowerMsg = (message || "").toLowerCase().trim();

  // 1. Explicit visit or decision/next-step request: 30
  const visitOrClosingSignals = [
    "site visit", "visit", "schedule a visit", "arrange a site visit", "tour",
    "ready to buy", "ready to close", "sanctioned", "pre-approved", "preapproved",
    "token", "booking amount", "advance", "finalize", "finalise", "all cash",
    "register", "ready to move", "cheque ready", "visited two projects already",
  ];

  // 2. Specific pricing, availability, financing or total-cost question: 20
  const pricingOrFinancingSignals = [
    "price", "pricing", "cost", "total cost", "maintenance", "loan", "financing",
    "pre-approved", "sanctioned", "available", "availability", "rate per sqft",
    "sqft rate", "emi", "payment plan", "bank tie-up", "bank tie-ups", "hidden cost",
    "registration charges", "gst", "cauvery", "possession date", "handover",
  ];

  // 3. Explicit comparison between options: 12
  const comparisonSignals = [
    "comparing", "compare", "between", "shortlisted", "shortlist", "evaluating",
    "versus", "vs", "competitor project",
  ];

  // 4. Broad initial research: 6
  const researchSignals = [
    "looking for", "interested in", "inquiry", "enquiry", "callback", "call me",
    "call back", "reach out", "connect on call", "phone number", "general information",
    "starting research", "exploring",
  ];

  let points = 0;
  if (visitOrClosingSignals.some((sig) => lowerMsg.includes(sig))) {
    points = 30;
  } else if (pricingOrFinancingSignals.some((sig) => lowerMsg.includes(sig)) || (budget && budget > 0 && lowerMsg.includes("?"))) {
    points = 20;
  } else if (comparisonSignals.some((sig) => lowerMsg.includes(sig))) {
    points = 12;
  } else if (researchSignals.some((sig) => lowerMsg.includes(sig)) || lowerMsg.length >= 10) {
    points = 6;
  } else {
    points = 0;
  }

  return Math.min(points, maxPoints);
}

function scoreRequirementCompleteness(location, requirement, budget, timeline, message) {
  const maxPoints = 25;
  let points = 0;

  const loc = (location || "").trim();
  const req = (requirement || "").trim();
  const lowerReq = req.toLowerCase();
  const lowerMsg = (message || "").toLowerCase();

  // 1. Known location: 5
  if (loc.length > 0 && loc.toLowerCase() !== "undecided") points += 5;
  // 2. Clear property requirement: 5
  if (req.length > 0) points += 5;
  // 3. Known budget: 5
  if (budget > 0) points += 5;
  // 4. Known buying timeline: 5
  if (timeline && timeline !== "not_specified") points += 5;
  // 5. At least one concrete customer need or constraint: 5
  const concreteConstraints = [
    "school", "kids", "children", "parents", "elderly", "parking", "car parking",
    "vaastu", "vastu", "facing", "high floor", "gated community", "gated",
    "rera", "a-khata", "a khata", "ready to move", "commute", "itpl", "tech park",
    "sq ft", "sqft", "sft", "balcony", "east", "north", "budget under", "all-inclusive",
    "cauvery", "possession",
  ];
  if (concreteConstraints.some((c) => lowerReq.includes(c) || lowerMsg.includes(c))) points += 5;

  return Math.min(points, maxPoints);
}

function scoreEngagementDepth(message, conversationTurns) {
  const maxPoints = 15;
  const msg = (message || "").trim();

  if (typeof conversationTurns === "number" && conversationTurns >= 3) return 15;
  if (typeof conversationTurns === "number" && conversationTurns === 2) return 10;
  if (msg.length >= 20 || (typeof conversationTurns === "number" && conversationTurns === 1)) return 4;
  if (msg.length > 0) return 2;
  return 0;
}

function bandFromScore(total) {
  if (total >= 75) return "hot";
  if (total >= 45) return "warm";
  return "cold";
}

function computeScore(lead) {
  const f1 = scoreTimeline(lead.buyingTimeline);
  const f2 = scoreIntent(lead.customerMessage, lead.budget);
  const f3 = scoreRequirementCompleteness(lead.location, lead.propertyRequirement, lead.budget, lead.buyingTimeline, lead.customerMessage);
  const f4 = scoreEngagementDepth(lead.customerMessage, lead.conversationTurns);
  const total = Math.max(0, Math.min(100, f1 + f2 + f3 + f4));
  return { total, band: bandFromScore(total), factors: { timeline: f1, intent: f2, completeness: f3, depth: f4 } };
}

// ── Test Suites ──

test("Factor point ceilings strictly match Prompt 3.1: 30, 30, 25, 15", () => {
  // Timeline: Max 30 pts
  assert.equal(scoreTimeline("immediate"), 30);
  assert.equal(scoreTimeline("1_to_3_months"), 22);
  assert.equal(scoreTimeline("3_to_6_months"), 14);
  assert.equal(scoreTimeline("6_to_12_months"), 7);
  assert.equal(scoreTimeline("beyond_12_months"), 7);
  assert.equal(scoreTimeline("not_specified"), 0);

  // Intent: Max 30 pts
  assert.equal(scoreIntent("Can we arrange a site visit this weekend?", 12000000), 30);
  assert.equal(scoreIntent("What are the maintenance and financing charges?", 6000000), 20);
  assert.equal(scoreIntent("Comparing Sarjapur vs Electronic City options", 8500000), 12);
  assert.equal(scoreIntent("Please call back to discuss options", 0), 6);
  assert.equal(scoreIntent("", 0), 0);

  // Completeness: Max 25 pts (5 x 5)
  const fullComp = scoreRequirementCompleteness(
    "Whitefield",
    "3 BHK near Greenwood High school",
    12000000,
    "immediate",
    "Need schools nearby"
  );
  assert.equal(fullComp, 25);

  // Depth: Max 15 pts
  assert.equal(scoreEngagementDepth("Long message", 3), 15);
  assert.equal(scoreEngagementDepth("Medium message", 2), 10);
  assert.equal(scoreEngagementDepth("One substantive initial message with details", 1), 4);
  assert.equal(scoreEngagementDepth("", 0), 0);
});

test("Priority bands match 75-100 Hot, 45-74 Warm, 0-44 Cold", () => {
  assert.equal(bandFromScore(75), "hot");
  assert.equal(bandFromScore(100), "hot");
  assert.equal(bandFromScore(74), "warm");
  assert.equal(bandFromScore(45), "warm");
  assert.equal(bandFromScore(44), "cold");
  assert.equal(bandFromScore(0), "cold");
});

test("Canonical hot lead (Priya Sharma) scores Hot (89/100)", () => {
  const priya = {
    budget: 12000000,
    buyingTimeline: "immediate",
    location: "Whitefield",
    propertyRequirement: "3 BHK apartment in a gated community, 1400+ sq ft, near good schools",
    customerMessage: "Hi, I'm looking for a 3 BHK in Whitefield near Orchids International. Can you arrange a site visit this weekend?",
  };
  const result = computeScore(priya);
  assert.equal(result.factors.timeline, 30);
  assert.equal(result.factors.intent, 30);
  assert.equal(result.factors.completeness, 25);
  assert.equal(result.factors.depth, 4);
  assert.equal(result.total, 89);
  assert.equal(result.band, "hot");
});

test("Canonical warm lead (Arjun Reddy) scores Warm (71/100)", () => {
  const arjun = {
    budget: 6000000,
    buyingTimeline: "1_to_3_months",
    location: "Sarjapur Road",
    propertyRequirement: "2 BHK apartment under 60 L close to tech parks",
    customerMessage: "Need clarity on home loan eligibility and bank tie-ups for under 60 L budget.",
  };
  const result = computeScore(arjun);
  assert.equal(result.factors.timeline, 22);
  assert.equal(result.factors.intent, 20);
  assert.equal(result.factors.completeness, 25);
  assert.equal(result.factors.depth, 4);
  assert.equal(result.total, 71);
  assert.equal(result.band, "warm");
});

test("Canonical cold lead (Deepak Gowda) scores Cold (20/100)", () => {
  const deepak = {
    budget: 0,
    buyingTimeline: "not_specified",
    location: "Yelahanka",
    propertyRequirement: "4 BHK",
    customerMessage: "Please call back to discuss 4 BHK options.",
  };
  const result = computeScore(deepak);
  assert.equal(result.factors.timeline, 0);
  assert.equal(result.factors.intent, 6);
  assert.equal(result.factors.completeness, 10);
  assert.equal(result.factors.depth, 4);
  assert.equal(result.total, 20);
  assert.equal(result.band, "cold");
});

test("Score is deterministic, pure, and bounded strictly within 0-100", () => {
  const emptyLead = {
    budget: 0,
    buyingTimeline: "not_specified",
    location: "",
    propertyRequirement: "",
    customerMessage: "",
  };
  const emptyRes = computeScore(emptyLead);
  assert.equal(emptyRes.total, 0);
  assert.equal(emptyRes.band, "cold");

  // Re-evaluation gives identical score
  assert.deepEqual(computeScore(emptyLead), emptyRes);
});
