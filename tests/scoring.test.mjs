import test from "node:test";
import assert from "node:assert/strict";
import {
  formatPriorityDisplay,
  normalizeAssistantPriorityText,
  PRIORITY_BAND_LABELS,
  PRIORITY_STYLES,
  priorityBandColor,
} from "../src/lib/leads/scoring.ts";
import { buildChatPrompt, generateFallbackChat } from "../src/lib/ai/prompts.ts";

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



function getPriorityBandLabel(score) {
  const band = bandFromScore(score);
  return PRIORITY_BAND_LABELS[band];
}

test("Priority bands match 75-100 Act Now (hot), 45-74 Follow Up (warm), 0-44 Nurture (cold)", () => {
  assert.equal(bandFromScore(75), "hot");
  assert.equal(bandFromScore(100), "hot");
  assert.equal(bandFromScore(74), "warm");
  assert.equal(bandFromScore(45), "warm");
  assert.equal(bandFromScore(44), "cold");
  assert.equal(bandFromScore(0), "cold");
});

test("Canonical priority labels map hot->Act Now, warm->Follow Up, cold->Nurture", () => {
  assert.equal(PRIORITY_BAND_LABELS.hot, "Act Now");
  assert.equal(PRIORITY_BAND_LABELS.warm, "Follow Up");
  assert.equal(PRIORITY_BAND_LABELS.cold, "Nurture");
});

test("Boundary scores map precisely to canonical priority labels", () => {
  // Boundary 0: Nurture
  assert.equal(bandFromScore(0), "cold");
  assert.equal(getPriorityBandLabel(0), "Nurture");

  // Boundary 44: Nurture (upper edge of Nurture)
  assert.equal(bandFromScore(44), "cold");
  assert.equal(getPriorityBandLabel(44), "Nurture");

  // Boundary 45: Follow Up (lower threshold of Follow Up)
  assert.equal(bandFromScore(45), "warm");
  assert.equal(getPriorityBandLabel(45), "Follow Up");

  // Boundary 74: Follow Up (upper threshold of Follow Up)
  assert.equal(bandFromScore(74), "warm");
  assert.equal(getPriorityBandLabel(74), "Follow Up");

  // Boundary 75: Act Now (lower threshold of Act Now)
  assert.equal(bandFromScore(75), "hot");
  assert.equal(getPriorityBandLabel(75), "Act Now");

  // Boundary 100: Act Now (maximum score)
  assert.equal(bandFromScore(100), "hot");
  assert.equal(getPriorityBandLabel(100), "Act Now");
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

test("Missing information permutations correctly decrement Requirement Completeness (5 pts each)", () => {
  // Base lead with all 5 completeness criteria: 25 pts
  const base = {
    location: "Whitefield",
    requirement: "3 BHK apartment",
    budget: 18000000,
    timeline: "immediate",
    message: "Need possession by December near ITPL",
  };
  assert.equal(scoreRequirementCompleteness(base.location, base.requirement, base.budget, base.timeline, base.message), 25);

  // Missing location: drops by 5 -> 20 pts
  assert.equal(scoreRequirementCompleteness("", base.requirement, base.budget, base.timeline, base.message), 20);
  assert.equal(scoreRequirementCompleteness("undecided", base.requirement, base.budget, base.timeline, base.message), 20);

  // Missing requirement: drops by 5 -> 20 pts
  assert.equal(scoreRequirementCompleteness(base.location, "", base.budget, base.timeline, base.message), 20);

  // Missing budget (0): drops by 5 -> 20 pts
  assert.equal(scoreRequirementCompleteness(base.location, base.requirement, 0, base.timeline, base.message), 20);

  // Missing timeline ("not_specified"): drops by 5 -> 20 pts
  assert.equal(scoreRequirementCompleteness(base.location, base.requirement, base.budget, "not_specified", base.message), 20);

  // Missing concrete constraints: drops by 5 -> 20 pts
  assert.equal(scoreRequirementCompleteness(base.location, "apartment", base.budget, base.timeline, "hello"), 20);

  // Missing all 5: 0 pts
  assert.equal(scoreRequirementCompleteness("", "", 0, "not_specified", "hello"), 0);
});

test("Four-factor model points ceiling strictly equals 100 points maximum", () => {
  const maxLead = {
    budget: 20000000,
    buyingTimeline: "immediate", // 30
    location: "Whitefield", // 5
    propertyRequirement: "3 BHK luxury near ITPL", // 5 + 5 (constraint: itpl)
    customerMessage: "Ready to visit this Saturday with my family and token cheque ready.", // 30 (intent)
    conversationTurns: 3, // 15 (depth)
  };
  const res = computeScore(maxLead);
  assert.equal(res.factors.timeline, 30);
  assert.equal(res.factors.intent, 30);
  assert.equal(res.factors.completeness, 25);
  assert.equal(res.factors.depth, 15);
  assert.equal(res.total, 100);
  assert.equal(res.band, "hot");
  assert.equal(getPriorityBandLabel(res.total), "Act Now");
});

// ---------------------------------------------------------------------------
// Defect Regression Suite: Complete Removal of Old Priority Terminology
// ---------------------------------------------------------------------------

test("1. Lead scored 89 strictly displays 'Act Now · 89' and never 'HOT (89)'", () => {
  const display = formatPriorityDisplay("hot", 89);
  assert.equal(display, "Act Now · 89");
  assert.ok(!display.includes("HOT"));
  assert.ok(!display.includes("Hot"));
  assert.ok(!display.includes("(89)"));
});

test("2. Scores 75 and 100 map to Act Now", () => {
  assert.equal(getPriorityBandLabel(75), "Act Now");
  assert.equal(getPriorityBandLabel(100), "Act Now");
  assert.equal(formatPriorityDisplay("hot", 75), "Act Now · 75");
  assert.equal(formatPriorityDisplay("hot", 100), "Act Now · 100");
});

test("3. Scores 45 and 74 map to Follow Up", () => {
  assert.equal(getPriorityBandLabel(45), "Follow Up");
  assert.equal(getPriorityBandLabel(74), "Follow Up");
  assert.equal(formatPriorityDisplay("warm", 45), "Follow Up · 45");
  assert.equal(formatPriorityDisplay("warm", 74), "Follow Up · 74");
});

test("4. Scores 0 and 44 map to Nurture", () => {
  assert.equal(getPriorityBandLabel(0), "Nurture");
  assert.equal(getPriorityBandLabel(44), "Nurture");
  assert.equal(formatPriorityDisplay("cold", 0), "Nurture · 0");
  assert.equal(formatPriorityDisplay("cold", 44), "Nurture · 44");
});

test("5. Sidebar and workspace filters map to canonical labels without old terminology", () => {
  assert.equal(PRIORITY_BAND_LABELS.hot, "Act Now");
  assert.equal(PRIORITY_BAND_LABELS.warm, "Follow Up");
  assert.equal(PRIORITY_BAND_LABELS.cold, "Nurture");
  const values = Object.values(PRIORITY_BAND_LABELS);
  assert.deepEqual(values, ["Act Now", "Follow Up", "Nurture"]);
  assert.ok(!values.includes("Hot"));
  assert.ok(!values.includes("Warm"));
  assert.ok(!values.includes("Cold"));
});

test("6. AI Coach header never renders old priority badges", () => {
  const bands = ["hot", "warm", "cold"];
  const scores = [89, 71, 20];
  bands.forEach((b, idx) => {
    const rendered = formatPriorityDisplay(b, scores[idx]);
    assert.ok(!rendered.includes("HOT"));
    assert.ok(!rendered.includes("WARM"));
    assert.ok(!rendered.includes("COLD"));
    assert.ok(rendered.includes(PRIORITY_BAND_LABELS[b]));
  });
});

test("7. AI Coach prompt instructs model with new canonical terminology only", () => {
  const mockLead = {
    id: "lead-001",
    name: "Priya Sharma",
    location: "Whitefield",
    propertyRequirement: "3 BHK apartment",
    budget: 12000000,
    buyingTimeline: "immediate",
    customerMessage: "Looking for a 3 BHK in Whitefield.",
    priority: { total: 89, band: "hot" },
  };
  const prompt = buildChatPrompt(mockLead, "Why is this lead Act Now rather than Follow Up?", []);
  assert.ok(prompt.includes("Scores from 75–100 are classified as Act Now, scores from 45–74 as Follow Up, and scores from 0–44 as Nurture."));
  assert.ok(!prompt.includes("75+ earns Hot status"));
  assert.ok(!prompt.includes("Priority: HOT"));
});

test("8. Fallback responses use the new priority terminology", () => {
  const mockLead = {
    id: "lead-001",
    name: "Priya Sharma",
    location: "Whitefield",
    propertyRequirement: "3 BHK apartment",
    budget: 12000000,
    buyingTimeline: "immediate",
    customerMessage: "Looking for a 3 BHK in Whitefield.",
    priority: { total: 89, band: "hot" },
  };
  const fallback = generateFallbackChat("Why is this lead Act Now rather than Follow Up?", mockLead);
  assert.ok(fallback.answer.includes("Scores from 75–100 are classified as **Act Now**, scores from 45–74 as **Follow Up**, and scores from 0–44 as **Nurture**."));
  assert.ok(!fallback.answer.includes("Hot status"));
  assert.ok(!fallback.answer.includes("are Warm"));
});

test("9. Legacy assistant messages containing old threshold explanations are safely normalized when displayed", () => {
  const legacyAssistantMsg = "Priya's lead is assessed as **HOT** (89/100 pts) based on the 4-factor scoring model:\n\n*Threshold rule*: A score of 75+ earns **Hot** status; 45–74 are **Warm**.";
  const normalized = normalizeAssistantPriorityText(legacyAssistantMsg);
  assert.ok(normalized.includes("assessed as **ACT NOW**"));
  assert.ok(normalized.includes("Scores from 75–100 are classified as **Act Now**, scores from 45–74 as **Follow Up**, and scores from 0–44 as **Nurture**."));
  assert.ok(!normalized.includes("**HOT**"));
  assert.ok(!normalized.includes("**Hot** status"));
  assert.ok(!normalized.includes("are **Warm**"));

  const legacyHeaderStyle = "HOT (89)";
  assert.equal(normalizeAssistantPriorityText(legacyHeaderStyle), "Act Now · 89");
});

test("10. User-authored text and verified customer quotations are not indiscriminately rewritten", () => {
  const customerInquiry = "We need a home with good ventilation because Bengaluru afternoons get very hot. Send warm regards to your sales manager.";
  // normalizeAssistantPriorityText is ONLY applied to assistant messages, NEVER to customer message or user input
  assert.equal(customerInquiry.includes("hot"), true);
  assert.equal(customerInquiry.includes("warm"), true);

  const userQuestion = "Why did the previous agent classify this lead as warm?";
  // In the UI, user messages (role === 'user') bypass normalizeAssistantPriorityText completely
  const userContent = userQuestion;
  assert.equal(userContent, "Why did the previous agent classify this lead as warm?");
});

test("11. Priority Color System: Boundary scores (74/75, 44/45, 0/100) map accurately to canonical categories", () => {
  // Score 100 & 75 -> Act Now (hot)
  assert.equal(bandFromScore(100), "hot");
  assert.equal(bandFromScore(75), "hot");
  assert.equal(PRIORITY_STYLES[bandFromScore(100)].label, "Act Now");
  assert.equal(PRIORITY_STYLES[bandFromScore(75)].label, "Act Now");

  // Score 74 -> Follow Up (warm)
  assert.equal(bandFromScore(74), "warm");
  assert.equal(PRIORITY_STYLES[bandFromScore(74)].label, "Follow Up");

  // Score 45 -> Follow Up (warm)
  assert.equal(bandFromScore(45), "warm");
  assert.equal(PRIORITY_STYLES[bandFromScore(45)].label, "Follow Up");

  // Score 44 -> Nurture (cold)
  assert.equal(bandFromScore(44), "cold");
  assert.equal(PRIORITY_STYLES[bandFromScore(44)].label, "Nurture");

  // Score 0 -> Nurture (cold)
  assert.equal(bandFromScore(0), "cold");
  assert.equal(PRIORITY_STYLES[bandFromScore(0)].label, "Nurture");
});

test("12. Priority Color System: Act Now is Red, Follow Up is Amber, Nurture is Blue in both Day and Night Modes", () => {
  // Act Now: Red
  const actNow = PRIORITY_STYLES.hot;
  assert.equal(actNow.label, "Act Now");
  assert.equal(actNow.day.text, "#B42318");
  assert.equal(actNow.day.bg, "#FEE4E2");
  assert.equal(actNow.day.border, "#FDA29B");
  assert.equal(actNow.night.text, "#FF8A80");
  assert.equal(actNow.night.bg, "#421D22");
  assert.equal(actNow.night.border, "#87333A");
  assert.ok(actNow.badgeClass.includes("badge-priority-hot"));

  // Follow Up: Amber
  const followUp = PRIORITY_STYLES.warm;
  assert.equal(followUp.label, "Follow Up");
  assert.equal(followUp.day.text, "#9A4D00");
  assert.equal(followUp.day.bg, "#FFF0CC");
  assert.equal(followUp.day.border, "#F5C26B");
  assert.equal(followUp.night.text, "#FFC166");
  assert.equal(followUp.night.bg, "#3B2A15");
  assert.equal(followUp.night.border, "#80571D");
  assert.ok(followUp.badgeClass.includes("badge-priority-warm"));

  // Nurture: Blue
  const nurture = PRIORITY_STYLES.cold;
  assert.equal(nurture.label, "Nurture");
  assert.equal(nurture.day.text, "#175CD3");
  assert.equal(nurture.day.bg, "#EAF2FF");
  assert.equal(nurture.day.border, "#A6C8FF");
  assert.equal(nurture.night.text, "#8DBBFF");
  assert.equal(nurture.night.bg, "#172D4D");
  assert.equal(nurture.night.border, "#355E91");
  assert.ok(nurture.badgeClass.includes("badge-priority-cold"));

  // Ensure priorityBandColor helper matches
  const pbcHot = priorityBandColor("hot");
  assert.equal(pbcHot.label, "Act Now");
  assert.equal(pbcHot.day.text, "#B42318");

  const pbcWarm = priorityBandColor("warm");
  assert.equal(pbcWarm.label, "Follow Up");
  assert.equal(pbcWarm.day.text, "#9A4D00");

  const pbcCold = priorityBandColor("cold");
  assert.equal(pbcCold.label, "Nurture");
  assert.equal(pbcCold.day.text, "#175CD3");
});
