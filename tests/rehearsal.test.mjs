import test from "node:test";
import assert from "node:assert/strict";
import { validateRehearsalResponse } from "../src/lib/ai/schemas.ts";
import {
  buildRehearsalBuyerPrompt,
  buildRehearsalCoachingPrompt,
  buildRehearsalPrompt,
  generateFallbackRehearsal,
} from "../src/lib/ai/prompts.ts";

// ---------------------------------------------------------------------------
// Mock Lead Fixtures
// ---------------------------------------------------------------------------

const PRIYA_LEAD = {
  name: "Priya Sharma",
  location: "Whitefield",
  propertyRequirement: "3 BHK Apartment",
  budget: 12000000,
  buyingTimeline: "1_to_3_months",
  customerMessage: "Looking for a 3 BHK in Whitefield for our family. Main concern is daily commute and school bus connectivity.",
  objections: [
    {
      label: "Daily traffic and school bus connectivity",
      severity: "high",
      evidenceQuote: "school bus connectivity",
      recommendedHandling: "Highlight feeder bus routes and off-peak commute times.",
    },
  ],
};

const ARJUN_LEAD = {
  name: "Arjun Reddy",
  location: "Sarjapur Road",
  propertyRequirement: "2 BHK Apartment",
  budget: 6500000,
  buyingTimeline: "immediate",
  customerMessage: "Earning ₹90,000/month. Need to know if bank loan approval fits within 50% EMI cap.",
  objections: [
    {
      label: "Home loan eligibility and EMI burden",
      severity: "high",
      evidenceQuote: "bank loan approval fits within 50% EMI cap",
      recommendedHandling: "Share pre-approved bank partners and low-friction loan desk qualification.",
    },
  ],
};

// ---------------------------------------------------------------------------
// 1. Schema Validation Tests
// ---------------------------------------------------------------------------

test("validateRehearsalResponse: parses valid roleplay buyer response", () => {
  const raw = {
    customerReply: "What makes your project worth the premium over neighbouring towers?",
  };

  const validated = validateRehearsalResponse(raw, "roleplay");
  assert.equal(validated.mode, "roleplay");
  assert.equal(validated.customerReply, raw.customerReply);
  assert.equal(validated.feedback, null);
});

test("validateRehearsalResponse: rejects empty customerReply in roleplay mode", () => {
  assert.throws(
    () => validateRehearsalResponse({ customerReply: "" }, "roleplay"),
    /Missing or empty required field: customerReply/
  );
  assert.throws(
    () => validateRehearsalResponse({}, "roleplay"),
    /Missing or empty required field: customerReply/
  );
});

test("validateRehearsalResponse: validates structured coach feedback with 4-dimension rubric", () => {
  const raw = {
    customerReply: "Coaching debrief ready.",
    feedback: {
      score: 8,
      summary: "Effective response that addressed pricing concerns with tangible metrics.",
      strengths: ["Validated customer anxiety", "Proposed clear weekend visit window"],
      concernAddressed: {
        addressed: true,
        explanation: "Directly explained carpet area value versus competitors.",
      },
      dimensions: [
        {
          dimension: "concern_addressing",
          label: "Addressing Core Concern",
          score: 4,
          explanation: "Tackled price comparison head-on.",
        },
        {
          dimension: "empathy_and_clarity",
          label: "Empathy & Clarity",
          score: 5,
          explanation: "Strong empathetic opening phrasing.",
        },
        {
          dimension: "evidence_relevance",
          label: "Evidence & Grounding",
          score: 4,
          explanation: "Cited usable carpet area stats.",
        },
        {
          dimension: "next_step_drive",
          label: "Call-to-Action & Next Step",
          score: 4,
          explanation: "Offered choice of Saturday or Sunday.",
        },
      ],
      improvements: ["Avoid mentioning competitor names directly"],
      keyImprovement: "Reinforce bank pre-approval status upfront",
      suggestedAlternative: "I completely understand your hesitation. Let's compare the layout sheets on Saturday at 11 AM.",
      disclaimer: "Subjective coaching scores evaluate conversational technique and do not predict commercial sales conversion.",
    },
  };

  const validated = validateRehearsalResponse(raw, "coach");
  assert.equal(validated.mode, "coach");
  assert.ok(validated.feedback);
  assert.equal(validated.feedback.score, 8);
  assert.equal(validated.feedback.concernAddressed.addressed, true);
  assert.equal(validated.feedback.dimensions.length, 4);

  // Verify all 4 dimensions are present and clamped 1 to 5
  for (const dim of validated.feedback.dimensions) {
    assert.ok(dim.score >= 1 && dim.score <= 5);
    assert.ok(dim.label.length > 0);
    assert.ok(dim.explanation.length > 0);
  }

  assert.ok(validated.feedback.keyImprovement.length > 0);
  assert.ok(validated.feedback.suggestedAlternative.length > 0);
  assert.ok(validated.feedback.disclaimer.includes("do not predict commercial"));
});

test("validateRehearsalResponse: clamps out-of-bound scores (score 1-10, dimensions 1-5)", () => {
  const raw = {
    customerReply: "Debrief",
    feedback: {
      score: 15, // Out of bounds
      strengths: ["Tone"],
      dimensions: [
        { dimension: "concern_addressing", label: "Concern", score: 99, explanation: "high" },
        { dimension: "empathy_and_clarity", label: "Empathy", score: -5, explanation: "low" },
      ],
      improvements: ["Pacing"],
      keyImprovement: "Listen more",
      suggestedAlternative: "Better script",
    },
  };

  const validated = validateRehearsalResponse(raw, "coach");
  assert.ok(validated.feedback);
  assert.equal(validated.feedback.score, 10); // Clamped to 10

  const concernDim = validated.feedback.dimensions.find((d) => d.dimension === "concern_addressing");
  assert.equal(concernDim?.score, 5); // Clamped to 5

  const empathyDim = validated.feedback.dimensions.find((d) => d.dimension === "empathy_and_clarity");
  assert.equal(empathyDim?.score, 1); // Clamped to 1
});

// ---------------------------------------------------------------------------
// 2. Prompt Grounding & Security Tests
// ---------------------------------------------------------------------------

test("buildRehearsalBuyerPrompt: grounds buyer role in lead profile and shields untrusted raw inquiry", () => {
  const prompt = buildRehearsalBuyerPrompt(
    PRIYA_LEAD,
    PRIYA_LEAD.objections[0],
    "Hello Priya, let me explain our transport options.",
    []
  );

  assert.ok(prompt.includes("Priya Sharma"));
  assert.ok(prompt.includes("Whitefield"));
  assert.ok(prompt.includes("Daily traffic and school bus connectivity"));
  assert.ok(prompt.includes('"""\nLooking for a 3 BHK in Whitefield'));
  assert.ok(prompt.includes("UNTRUSTED raw input wrapped in triple quotes"));
  assert.ok(prompt.includes("RESIST WEAK ANSWERS"));
  assert.ok(prompt.includes("AVOID HALLUCINATIONS"));
});

test("buildRehearsalBuyerPrompt: instructs AI buyer to make opening move when message is empty", () => {
  const prompt = buildRehearsalBuyerPrompt(
    ARJUN_LEAD,
    ARJUN_LEAD.objections[0],
    "",
    []
  );

  assert.ok(prompt.includes("Open the rehearsal conversation as Arjun Reddy by directly raising your primary concern"));
  assert.ok(prompt.includes("Home loan eligibility and EMI burden"));
});

test("buildRehearsalCoachingPrompt: requires 4 rubric dimensions and explicit non-prediction disclaimer", () => {
  const history = [
    { role: "customer", content: "Is the school bus connectivity realistic?" },
    { role: "salesperson", content: "Yes, 3 top schools have active buses picking up right at Gate 1." },
  ];

  const prompt = buildRehearsalCoachingPrompt(
    PRIYA_LEAD,
    PRIYA_LEAD.objections[0],
    history
  );

  assert.ok(prompt.includes("principal real-estate sales performance coach"));
  assert.ok(prompt.includes("concern_addressing"));
  assert.ok(prompt.includes("empathy_and_clarity"));
  assert.ok(prompt.includes("evidence_relevance"));
  assert.ok(prompt.includes("next_step_drive"));
  assert.ok(prompt.includes("do not predict commercial conversion"));
  assert.ok(prompt.includes("ACTUAL REHEARSAL TRANSCRIPT"));
});

// ---------------------------------------------------------------------------
// 3. Fallback Heuristic Engine Tests (Grounded Persona & Resistance)
// ---------------------------------------------------------------------------

test("generateFallbackRehearsal: Priya Sharma begins with school commute objection", () => {
  const result = generateFallbackRehearsal("", PRIYA_LEAD, [], false, "roleplay", PRIYA_LEAD.objections[0]);
  assert.equal(result.mode, "roleplay");
  assert.ok(result.customerReply.includes("school commute"));
  assert.ok(result.customerReply.includes("Whitefield"));
});

test("generateFallbackRehearsal: Arjun Reddy begins with EMI / salary anxiety", () => {
  const result = generateFallbackRehearsal("", ARJUN_LEAD, [], false, "roleplay", ARJUN_LEAD.objections[0]);
  assert.equal(result.mode, "roleplay");
  assert.ok(result.customerReply.includes("₹90k") || result.customerReply.includes("salary"));
  assert.ok(result.customerReply.includes("EMI"));
});

test("generateFallbackRehearsal: pushes back realistically on weak or dismissive answers", () => {
  const history = [
    { role: "customer", content: "Is school bus connectivity realistic?" },
  ];

  // Salesperson gives generic non-answer
  const weakAnswer = "Don't worry, everything is great with our amenities and clubhouse.";
  const pushbackResult = generateFallbackRehearsal(
    weakAnswer,
    PRIYA_LEAD,
    [...history, { role: "salesperson", content: weakAnswer }],
    false,
    "roleplay",
    PRIYA_LEAD.objections[0]
  );

  assert.ok(
    pushbackResult.customerReply.includes("haven't answered my main worry") ||
    pushbackResult.customerReply.includes("school commute")
  );
});

test("generateFallbackRehearsal: generates comprehensive 4-dimension debrief in coach mode", () => {
  const history = [
    { role: "customer", content: "Is school bus connectivity realistic?" },
    {
      role: "salesperson",
      content: "I completely understand that daily school commute is a top priority for your daughter. Our project has verified tie-ups with 3 top Whitefield schools with feeder buses right at Gate 1. Would Saturday at 11 AM or Sunday at 3 PM work for a 20-minute walkthrough?",
    },
  ];

  const debrief = generateFallbackRehearsal(
    "",
    PRIYA_LEAD,
    history,
    true,
    "coach",
    PRIYA_LEAD.objections[0]
  );

  assert.equal(debrief.mode, "coach");
  assert.ok(debrief.feedback);
  assert.ok(debrief.feedback.score >= 7);
  assert.equal(debrief.feedback.concernAddressed.addressed, true);
  assert.equal(debrief.feedback.dimensions.length, 4);

  // Verify all 4 rubric dimensions exist with valid explanations
  const dimKeys = debrief.feedback.dimensions.map((d) => d.dimension);
  assert.ok(dimKeys.includes("concern_addressing"));
  assert.ok(dimKeys.includes("empathy_and_clarity"));
  assert.ok(dimKeys.includes("evidence_relevance"));
  assert.ok(dimKeys.includes("next_step_drive"));

  assert.ok(debrief.feedback.keyImprovement.length > 0);
  assert.ok(debrief.feedback.suggestedAlternative.includes("Priya"));
  assert.ok(debrief.feedback.disclaimer.includes("do not predict commercial closing probability"));
});

test("generateFallbackRehearsal: penalises lack of empathy and missing CTA in coaching rubric", () => {
  const history = [
    { role: "customer", content: "Your price is too high." },
    { role: "salesperson", content: "Price is fixed." }, // Rude, zero empathy, zero CTA
  ];

  const debrief = generateFallbackRehearsal(
    "",
    PRIYA_LEAD,
    history,
    true,
    "coach",
    PRIYA_LEAD.objections[0]
  );

  assert.ok(debrief.feedback);
  const empathyDim = debrief.feedback.dimensions.find((d) => d.dimension === "empathy_and_clarity");
  assert.ok(empathyDim && empathyDim.score <= 2);

  const ctaDim = debrief.feedback.dimensions.find((d) => d.dimension === "next_step_drive");
  assert.ok(ctaDim && ctaDim.score <= 2);
});
