import test from "node:test";
import assert from "node:assert/strict";
import { validateAnalysisResponse } from "../src/lib/ai/schemas.ts";

test("validateAnalysisResponse validates all required fields successfully", () => {
  const mockValid = {
    summary: "Priya is looking for a 3 BHK in Whitefield for immediate relocation.",
    intent: "ready_to_buy",
    customerIntent: {
      category: "ready_to_buy",
      explanation: "Explicit site visit requested with near-term relocation date.",
    },
    intentConfidence: 0.95,
    keyRequirements: [
      {
        requirement: "3 BHK apartment near Orchids International",
        confidence: "explicit",
        evidenceQuote: "3 BHK apartment in Whitefield",
      },
    ],
    objections: [
      {
        label: "Traffic congestion on Whitefield Main Road",
        concern: "Worried about peak-hour school traffic",
        severity: "medium",
        evidenceQuote: "how is the traffic situation",
        recommendedHandling: "Share school bus route map and off-peak travel times.",
      },
    ],
    recommendedNextAction: {
      action: "Arrange Saturday site visit",
      type: "site_visit",
      timeframe: "Within 24 hours",
      rationale: "Immediate move-in timeline requires fast physical inspection.",
      urgency: "immediate",
    },
    suggestedResponse: "Hi Priya, I can arrange a site visit for Saturday morning.",
    missingInformation: ["Floor height preference not stated"],
    evidence: [
      {
        field: "customerMessage",
        quote: "Can you arrange a site visit this weekend?",
        verified: true,
      },
    ],
    uncertainties: ["Lease ending date flexibility unconfirmed"],
    timeline: [
      {
        dayOffset: 0,
        action: "Send visit confirmation",
        channel: "whatsapp",
        completed: false,
      },
    ],
  };

  const sourceLead = {
    customerMessage: "Hi, I'm looking for a 3 BHK apartment in Whitefield. Can you arrange a site visit this weekend? Also, how is the traffic situation on Whitefield Main Road?",
    location: "Whitefield",
    propertyRequirement: "3 BHK",
    budget: 12000000,
    buyingTimeline: "immediate",
  };

  const result = validateAnalysisResponse(mockValid, sourceLead);

  assert.equal(result.summary, mockValid.summary);
  assert.equal(result.intent, "ready_to_buy");
  assert.equal(result.customerIntent?.category, "ready_to_buy");
  assert.equal(result.intentConfidence, 0.95);
  assert.equal(result.keyRequirements?.length, 1);
  assert.equal(result.objections.length, 1);
  assert.equal(result.objections[0].severity, "medium");
  assert.equal(result.objections[0].recommendedHandling, "Share school bus route map and off-peak travel times.");
  assert.equal(result.recommendedNextAction?.urgency, "immediate");
  assert.equal(result.evidence?.[0].verified, true);
});

test("validateAnalysisResponse rejects non-object or missing required fields", () => {
  assert.throws(() => validateAnalysisResponse(null), /AI response is not an object/);
  assert.throws(() => validateAnalysisResponse("string response"), /AI response is not an object/);
  assert.throws(() => validateAnalysisResponse({ summary: "Summary here" }), /Missing or empty required field: suggestedResponse/);
  assert.throws(() => validateAnalysisResponse({ suggestedResponse: "Hello" }), /Missing or empty required field: summary/);
});

test("validateAnalysisResponse flags unverified or fabricated quotations", () => {
  const mockWithFabricatedQuote = {
    summary: "Lead analysis summary.",
    suggestedResponse: "Hello there.",
    intent: "ready_to_buy",
    objections: [
      {
        label: "Price sensitivity",
        severity: "high",
        evidenceQuote: "I will never pay more than 50 lakhs under any condition", // Fabricated quote!
        recommendedHandling: "Offer discounts.",
      },
    ],
    evidence: [
      {
        field: "customerMessage",
        quote: "I promise to buy if you give 20% discount", // Fabricated quote!
      },
    ],
  };

  const sourceLead = {
    customerMessage: "Looking for 3 BHK in Whitefield.",
  };

  const result = validateAnalysisResponse(mockWithFabricatedQuote, sourceLead);

  // The objection evidence quote was not in customerMessage, so it's flagged as [Unverified Quote]
  assert.ok(result.objections[0].evidenceQuote?.includes("[Unverified Quote]"));

  // The evidence array item is marked verified: false
  assert.equal(result.evidence?.[0].verified, false);
});

test("validateAnalysisResponse bounds intent confidence and clamps invalid enums", () => {
  const mockExtreme = {
    summary: "Summary text.",
    suggestedResponse: "Hello text.",
    intent: "invalid_random_intent",
    intentConfidence: 15.5, // Out of bounds (>1)
    objections: [
      {
        label: "Concern",
        severity: "super_ultra_critical", // Invalid severity
      },
    ],
    recommendedAction: {
      type: "send_carrier_pigeon", // Invalid action type
    },
  };

  const result = validateAnalysisResponse(mockExtreme);

  assert.equal(result.intent, "unclear");
  assert.equal(result.intentConfidence, 1.0); // Clamped to 1.0
  assert.equal(result.objections[0].severity, "medium"); // Defaulted to medium
  assert.equal(result.recommendedAction.type, "follow_up"); // Defaulted to follow_up
});
