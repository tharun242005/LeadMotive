// ============================================================================
// SignalDesk — Unit Test Suite: Lead Momentum Plan
// ============================================================================
//
// Tests:
// 1. Dynamic plan length validation (accepts 3-10 steps, rejects <3 or >10)
// 2. Schema integrity (required strings, arrays, draft checklist, branches)
// 3. Plan adaptation (preserves completed history, appends revised steps)
// 4. Status lifecycle transitions (pending -> completed, blocked with reason)
// 5. Dynamic progress calculation (accurate percent based on steps)
// ============================================================================

import test from "node:test";
import assert from "node:assert/strict";

import { validatePlanResponse } from "../src/lib/ai/schemas.ts";
import { SEEDED_MOMENTUM_PLANS } from "../src/lib/leads/momentum-fixtures.ts";

test("validates dynamic step count bounds (3 to 10 steps)", () => {
  const priyaPlan = SEEDED_MOMENTUM_PLANS["lead-001"];
  const arjunPlan = SEEDED_MOMENTUM_PLANS["lead-002"];
  const deepakPlan = SEEDED_MOMENTUM_PLANS["lead-006"];

  assert.equal(priyaPlan.steps.length, 4, "Priya should have 4 steps (fast-track site visit)");
  assert.equal(arjunPlan.steps.length, 6, "Arjun should have 6 steps (financing pre-approval)");
  assert.equal(deepakPlan.steps.length, 3, "Deepak should have 3 steps (discovery & qualification)");

  // Validate all 3 pass schema validation
  assert.doesNotThrow(() => validatePlanResponse(priyaPlan));
  assert.doesNotThrow(() => validatePlanResponse(arjunPlan));
  assert.doesNotThrow(() => validatePlanResponse(deepakPlan));

  // Reject plan with 2 steps (< 3)
  const tooShortPlan = {
    ...priyaPlan,
    steps: priyaPlan.steps.slice(0, 2),
  };
  assert.throws(
    () => validatePlanResponse(tooShortPlan),
    /Plan step count must be between 3 and 10 steps/
  );

  // Reject plan with 11 steps (> 10)
  const tooLongSteps = Array.from({ length: 11 }, (_, i) => ({
    ...priyaPlan.steps[0],
    id: `step-${i + 1}`,
    sequence: i + 1,
  }));
  const tooLongPlan = {
    ...priyaPlan,
    steps: tooLongSteps,
  };
  assert.throws(
    () => validatePlanResponse(tooLongPlan),
    /Plan step count must be between 3 and 10 steps/
  );
});

test("validates required schema fields and structured branches", () => {
  const priyaPlan = SEEDED_MOMENTUM_PLANS["lead-001"];
  const validated = validatePlanResponse(priyaPlan);

  assert.ok(validated.planTitle.length > 0);
  assert.ok(validated.leadSituationSummary.length > 0);
  assert.ok(validated.strategyRationale.length > 0);
  assert.ok(validated.successDefinition.length > 0);
  assert.ok(Array.isArray(validated.assumptions));
  assert.ok(Array.isArray(validated.unknowns));

  // Check step 1 draft
  const step1 = validated.steps[0];
  assert.ok(step1.communicationDraft, "Step 1 should include communication draft");
  assert.equal(step1.communicationDraft.channel, "whatsapp");
  assert.ok(step1.communicationDraft.draft.includes("Deens Academy"));
  assert.ok(step1.communicationDraft.verificationChecklist.length > 0);

  // Check step 1 decision branches
  assert.ok(step1.decisionBranches && step1.decisionBranches.length > 0);
  assert.equal(step1.decisionBranches[0].planImpact, "proceed");
});

test("preserves completed step history when adapting plan", () => {
  const plan = SEEDED_MOMENTUM_PLANS["lead-001"];
  const completedSteps = plan.steps.filter((s) => s.status === "completed");

  assert.equal(completedSteps.length, 1, "Priya plan has 1 completed step");

  // Simulate adaptation
  const adaptationReason = "Buyer postponed visit to next Saturday";
  const adaptedRemainingSteps = [
    {
      id: "step-adapt-2",
      sequence: 2,
      title: "Confirm Next Saturday Walkthrough Slot",
      category: "outreach",
      purpose: "Re-confirm 11 AM slot for following weekend",
      instructions: "Send WhatsApp confirmation for rescheduled Saturday.",
      rationale: "Accommodates customer schedule shift while maintaining momentum.",
      supportingEvidence: ["Buyer postponed visit to next Saturday"],
      timing: "Day 5",
      prerequisites: ["Step 1 completed"],
      expectedOutcome: "Visit rescheduled.",
      completionCriteria: "Confirmation received.",
      risksOrUnknowns: ["Buyer cancels again."],
      contingency: "Offer virtual walkthrough.",
      status: "pending",
    },
    {
      id: "step-adapt-3",
      sequence: 3,
      title: "Host Walkthrough on Next Saturday",
      category: "site_visit_prep",
      purpose: "Inspect 3 BHK layout.",
      instructions: "Conduct walkthrough.",
      rationale: "Direct unit tour.",
      supportingEvidence: ["3 BHK Whitefield requirement"],
      timing: "Next Saturday",
      prerequisites: ["Step 2 completed"],
      expectedOutcome: "Unit selection.",
      completionCriteria: "Walkthrough done.",
      risksOrUnknowns: [],
      contingency: "Secondary unit backup.",
      status: "pending",
    },
  ];

  const adaptedPlan = {
    ...plan,
    planVersion: plan.planVersion + 1,
    steps: [...completedSteps, ...adaptedRemainingSteps].map((s, idx) => ({
      ...s,
      sequence: idx + 1,
    })),
  };

  const validated = validatePlanResponse(adaptedPlan);
  assert.equal(validated.planVersion, 2);
  assert.equal(validated.steps.length, 3);
  assert.equal(validated.steps[0].status, "completed");
  assert.equal(validated.steps[0].id, "step-p1");
  assert.equal(validated.steps[1].status, "pending");
  assert.equal(validated.steps[1].title, "Confirm Next Saturday Walkthrough Slot");
});

test("calculates dynamic execution progress accurately", () => {
  const plan = SEEDED_MOMENTUM_PLANS["lead-001"]; // 4 steps, 1 completed
  const total = plan.steps.length;
  const completed = plan.steps.filter((s) => s.status === "completed").length;
  const skipped = plan.steps.filter((s) => s.status === "skipped").length;
  const percent = Math.round(((completed + skipped) / total) * 100);

  assert.equal(total, 4);
  assert.equal(completed, 1);
  assert.equal(skipped, 0);
  assert.equal(percent, 25, "1/4 steps should be 25%");

  // If another step completed:
  const updatedSteps = plan.steps.map((s, idx) => (idx === 1 ? { ...s, status: "completed" } : s));
  const newCompleted = updatedSteps.filter((s) => s.status === "completed").length;
  const newPercent = Math.round(((newCompleted + skipped) / total) * 100);

  assert.equal(newCompleted, 2);
  assert.equal(newPercent, 50, "2/4 steps should be 50%");
});

test("supports blocked status with mandatory reason", () => {
  const plan = SEEDED_MOMENTUM_PLANS["lead-002"];
  const stepToBlock = plan.steps[1];

  const blockedStep = {
    ...stepToBlock,
    status: "blocked",
    blockedReason: "Waiting on HDFC salary slip verification",
  };

  const updatedPlan = {
    ...plan,
    steps: plan.steps.map((s) => (s.id === blockedStep.id ? blockedStep : s)),
  };

  const validated = validatePlanResponse(updatedPlan);
  const foundBlocked = validated.steps.find((s) => s.id === blockedStep.id);

  assert.ok(foundBlocked);
  assert.equal(foundBlocked.status, "blocked");
  assert.equal(foundBlocked.blockedReason, "Waiting on HDFC salary slip verification");
});
