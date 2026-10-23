// ============================================================================
// LeadMotive — AI Response Validation Schemas
// ============================================================================
//
// Runtime validation for AI model responses before they reach the UI.
// Ensures the AI output matches our type contracts.
// ============================================================================

import type { AnalyzeLeadResponse, RehearsalResponse, PlanResponse, ChatResponse, RehearsalMode } from "@/types/ai";
import type { CustomerIntent, MomentumPlanStep, StepCategory, StepStatus, RubricDimension, RehearsalFeedback, RehearsalScenarioType } from "@/types/lead";


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
export function validateAnalysisResponse(
  raw: unknown,
  sourceLead?: { customerMessage?: string; location?: string; propertyRequirement?: string; budget?: number; buyingTimeline?: string }
): Omit<AnalyzeLeadResponse, "meta"> {
  if (!raw || typeof raw !== "object") {
    throw new Error("AI response is not an object");
  }

  const r = raw as Record<string, unknown>;

  // Required string fields (with resilient alias support)
  const rawSummary = r.summary || r.overview || r.executiveSummary;
  const summary =
    typeof rawSummary === "string" && rawSummary.trim().length > 0
      ? rawSummary.trim()
      : expectString(r, "summary");

  const rawSuggestedResponse =
    r.suggestedResponse ||
    r.suggested_response ||
    r.suggestedReply ||
    r.suggested_reply ||
    r.draftResponse ||
    r.response;
  const suggestedResponse =
    typeof rawSuggestedResponse === "string" && rawSuggestedResponse.trim().length > 0
      ? rawSuggestedResponse.trim()
      : expectString(r, "suggestedResponse");

  // Normalized source message for verbatim quotation verification
  const sourceText = (sourceLead?.customerMessage || "").toLowerCase();

  // Intent
  const rawIntent = (r.intent as CustomerIntent) || (r.customerIntent && typeof r.customerIntent === "object" ? (r.customerIntent as Record<string, unknown>).category as CustomerIntent : undefined);
  const intent = VALID_INTENTS.includes(rawIntent as CustomerIntent)
    ? (rawIntent as CustomerIntent)
    : "unclear";

  const customerIntent = {
    category: intent,
    explanation: r.customerIntent && typeof r.customerIntent === "object" && typeof (r.customerIntent as Record<string, unknown>).explanation === "string"
      ? String((r.customerIntent as Record<string, unknown>).explanation)
      : `Classified as ${intent} based on customer inquiry signals.`,
  };

  // Confidence
  const intentConfidence = typeof r.intentConfidence === "number"
    ? Math.max(0, Math.min(1, r.intentConfidence))
    : 0.5;

  // Requirements & keyRequirements
  const rawReqList = Array.isArray(r.keyRequirements) ? r.keyRequirements : (Array.isArray(r.requirements) ? r.requirements : []);
  const keyRequirements = rawReqList
    .filter((req: unknown) => req && typeof req === "object")
    .map((req: unknown) => {
      const rq = req as Record<string, unknown>;
      const label = String(rq.requirement || rq.label || "Customer requirement");
      const confidence = rq.confidence === "inferred" ? ("inferred" as const) : ("explicit" as const);
      const evidenceQuote = typeof rq.evidenceQuote === "string" ? rq.evidenceQuote.trim() : undefined;
      return {
        label,
        confidence,
        ...(evidenceQuote ? { evidenceQuote } : {}),
      };
    });

  const requirements = keyRequirements.map((k) => ({
    label: k.label,
    confidence: k.confidence,
    evidenceQuote: k.evidenceQuote,
  }));

  // Objections array with evidenceQuote and recommendedHandling
  const objections = Array.isArray(r.objections)
    ? r.objections
        .filter((obj: unknown) => obj && typeof obj === "object")
        .map((obj: unknown) => {
          const ob = obj as Record<string, unknown>;
          const label = String(ob.label || ob.concern || "Customer concern");
          const severity = ["high", "medium", "low"].includes(String(ob.severity))
            ? (String(ob.severity) as "high" | "medium" | "low")
            : "medium";
          const rawQuote = typeof ob.evidenceQuote === "string" ? ob.evidenceQuote.trim() : "";
          // Check if quote corresponds to supplied input
          const quoteVerified = rawQuote && sourceText ? sourceText.includes(rawQuote.toLowerCase()) : false;
          const evidenceQuote = rawQuote ? (quoteVerified ? rawQuote : `[Unverified Quote] ${rawQuote}`) : undefined;
          const recommendedHandling = typeof ob.recommendedHandling === "string"
            ? ob.recommendedHandling.trim()
            : "Clarify concern and provide transparent documentation.";

          return {
            label,
            severity,
            ...(evidenceQuote ? { evidenceQuote } : {}),
            recommendedHandling,
          };
        })
    : [];

  // Recommended action & recommendedNextAction
  const rawAction = (r.recommendedNextAction || r.recommendedAction) as Record<string, unknown> | undefined;
  const actionType = rawAction && VALID_ACTION_TYPES.includes(String(rawAction.type))
    ? (String(rawAction.type) as AnalyzeLeadResponse["recommendedAction"]["type"])
    : "follow_up" as const;
  const actionDesc = rawAction ? String(rawAction.action || rawAction.description || "Follow up with the lead") : "Follow up with the lead";
  const actionTimeframe = rawAction ? String(rawAction.timeframe || "Within 24 hours") : "Within 24 hours";
  const actionRationale = rawAction && typeof rawAction.rationale === "string" ? rawAction.rationale.trim() : "Recommended based on lead urgency.";
  const actionUrgency = rawAction && ["immediate", "high", "normal", "low"].includes(String(rawAction.urgency))
    ? (String(rawAction.urgency) as "immediate" | "high" | "normal" | "low")
    : "normal" as const;

  const recommendedAction = {
    type: actionType,
    description: actionDesc,
    timeframe: actionTimeframe,
    rationale: actionRationale,
    urgency: actionUrgency,
  };

  const recommendedNextAction = {
    ...recommendedAction,
    action: actionDesc,
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

  // ── Factual Grounding & Sanitization for Unverified Claims ──
  let sanitizedSummary = summary;
  const ungroundedFestivalInSummary = /\b(diwali|deepavali|dussehra|navratri)\b/i.test(summary) && !/\b(diwali|deepavali|dussehra|navratri)\b/i.test(sourceText);
  if (ungroundedFestivalInSummary) {
    sanitizedSummary = sanitizedSummary
      .replace(/\b(?:before|by|during|for)\s+(?:diwali|deepavali|dussehra|navratri)\b/gi, "by their target possession date")
      .replace(/\b(?:diwali|deepavali|dussehra|navratri)\b/gi, "target timeline");
  }

  // Sanitize affirmative unverified inventory claims in suggestedResponse to conditional phrasing
  let sanitizedSuggestedResponse = suggestedResponse;
  if (/\b(diwali|deepavali|dussehra|navratri)\b/i.test(sanitizedSuggestedResponse) && !/\b(diwali|deepavali|dussehra|navratri)\b/i.test(sourceText)) {
    sanitizedSuggestedResponse = sanitizedSuggestedResponse
      .replace(/\b(?:before|by|during|for)\s+(?:diwali|deepavali|dussehra|navratri)\b/gi, "by your target possession timeline")
      .replace(/\b(?:diwali|deepavali|dussehra|navratri)\b/gi, "target timeline");
  }

  // Convert unverified affirmative inventory claims into conditional verification wording
  sanitizedSuggestedResponse = sanitizedSuggestedResponse.replace(
    /\b(?:we have|i have)\s+(?:available\s+)?(?:[\w\s-]{0,30})?(?:ready-to-move(?:-in)?|suitable|\d+\s*bhk|matching)\s+(?:units|properties|apartments|flats|options|residences)\s+available\b/gi,
    "I would be glad to check current availability for suitable options"
  );
  sanitizedSuggestedResponse = sanitizedSuggestedResponse.replace(
    /\b(?:we have|i have)\s+ready-to-move(?:-in)?\s+[^.]+?\s*available\b/gi,
    "I would be glad to check current availability for ready-to-move-in options"
  );
  sanitizedSuggestedResponse = sanitizedSuggestedResponse.replace(
    /\b(?:we have|i have)\s+(?:suitable\s+)?(?:properties|units|options|apartments|flats)\s+available\b/gi,
    "I would be glad to check current availability for suitable options"
  );
  sanitizedSuggestedResponse = sanitizedSuggestedResponse.replace(
    /\b(?:we have|i have)\s+\d+\s+handpicked\s+verified\s+projects\s+that\s+align\b/gi,
    "I would be glad to check verified projects that align"
  );
  sanitizedSuggestedResponse = sanitizedSuggestedResponse.replace(
    /\b(?:we have|i have)\s+(?:a\s+)?suitable\s+(?:\d+\s*bhk|property|unit|flat|apartment)\s+available\b/gi,
    "I would be glad to check availability for suitable options"
  );

  // Missing Information
  const missingInformation = Array.isArray(r.missingInformation)
    ? r.missingInformation.map((m) => String(m).trim()).filter(Boolean)
    : [];

  // Ensure unverified property availability is documented as a question to verify
  const hasInventoryMissingInfo = missingInformation.some((m) =>
    /inventory|availability|handover|possession/i.test(m)
  );
  if (!hasInventoryMissingInfo) {
    missingInformation.unshift("Developer unit availability and confirmed handover timeline require verification with the project team.");
  }

  // Grounded Evidence Quotes validation
  const rawEvidence = Array.isArray(r.evidence) ? r.evidence : [];
  const evidence = rawEvidence
    .filter((e: unknown) => e && typeof e === "object")
    .map((e: unknown) => {
      const ev = e as Record<string, unknown>;
      const field = String(ev.field || "customerMessage");
      const quote = String(ev.quote || "").trim();
      const verified = quote && sourceText ? sourceText.includes(quote.toLowerCase()) : false;
      return { field, quote, verified };
    });

  // Uncertainties
  const uncertainties = Array.isArray(r.uncertainties)
    ? r.uncertainties.map((u) => String(u).trim()).filter(Boolean)
    : [];

  const hasInventoryUncertainty = uncertainties.some((u) =>
    /inventory|availability|developer/i.test(u)
  );
  if (!hasInventoryUncertainty) {
    uncertainties.push("Matching property inventory is subject to real-time verification with the developer site office.");
  }
  if (ungroundedFestivalInSummary) {
    uncertainties.push("Corrected ungrounded festival/holiday reference not established by customer message.");
  }

  return {
    summary: sanitizedSummary,
    intent,
    customerIntent,
    intentConfidence,
    requirements,
    keyRequirements,
    objections,
    recommendedAction,
    recommendedNextAction,
    suggestedResponse: sanitizedSuggestedResponse,
    timeline,
    missingInformation,
    evidence,
    uncertainties,
  };
}

/**
 * Validate an objection rehearsal response (roleplay or coach mode).
 */
export function validateRehearsalResponse(
  raw: unknown,
  expectedMode: RehearsalMode = "roleplay",
  expectedScenarioType?: RehearsalScenarioType
): Omit<RehearsalResponse, "meta"> {
  if (!raw || typeof raw !== "object") {
    throw new Error("Rehearsal response is not an object");
  }

  const r = raw as Record<string, unknown>;

  // Customer reply: required in roleplay mode, optional/defaulted in coach mode
  let customerReply = "";
  if (typeof r.customerReply === "string") {
    customerReply = r.customerReply.trim();
  }

  if (expectedMode === "roleplay" && !customerReply) {
    throw new Error("Missing or empty required field: customerReply");
  }

  if (expectedMode === "coach" && !customerReply) {
    customerReply = "Coaching debrief ready.";
  }

  let feedback: RehearsalFeedback | null = null;
  if (r.feedback && typeof r.feedback === "object") {
    const f = r.feedback as Record<string, unknown>;
    const score = typeof f.score === "number" ? Math.max(1, Math.min(10, Math.round(f.score))) : 7;
    const summary = typeof f.summary === "string" && f.summary.trim() ? f.summary.trim() : undefined;

    const strengths = Array.isArray(f.strengths)
      ? f.strengths.map((s) => String(s).trim()).filter(Boolean)
      : ["Maintained a professional tone during practice"];

    const improvements = Array.isArray(f.improvements)
      ? f.improvements.map((s) => String(s).trim()).filter(Boolean)
      : ["Focus on validating customer anxiety before presenting project specs"];

    // Concern Addressed object
    let concernAddressed = {
      addressed: true,
      explanation: "Addressed the customer's stated hesitation during the dialogue.",
    };
    if (f.concernAddressed && typeof f.concernAddressed === "object") {
      const ca = f.concernAddressed as Record<string, unknown>;
      concernAddressed = {
        addressed: Boolean(ca.addressed),
        explanation: typeof ca.explanation === "string" && ca.explanation.trim()
          ? ca.explanation.trim()
          : "Evaluated against customer objection evidence.",
      };
    }

    // 4 Rubric dimensions: concern_addressing, empathy_and_clarity, evidence_relevance, next_step_drive
    const rawDimensions = Array.isArray(f.dimensions) ? f.dimensions : [];
    const validDimKeys = ["concern_addressing", "empathy_and_clarity", "evidence_relevance", "next_step_drive"] as const;

    const dimMap = new Map<string, RubricDimension>();
    for (const d of rawDimensions) {
      if (d && typeof d === "object") {
        const item = d as Record<string, unknown>;
        const dimKey = String(item.dimension || "");
        if (validDimKeys.includes(dimKey as typeof validDimKeys[number])) {
          dimMap.set(dimKey, {
            dimension: dimKey as typeof validDimKeys[number],
            label: typeof item.label === "string" ? item.label : dimKey.replace(/_/g, " "),
            score: typeof item.score === "number" ? Math.max(1, Math.min(5, Math.round(item.score))) : 3,
            explanation: typeof item.explanation === "string" ? item.explanation : "Dimension assessed.",
          });
        }
      }
    }

    // Ensure all 4 dimensions are populated
    const defaultLabels: Record<typeof validDimKeys[number], string> = {
      concern_addressing: "Addressing Core Concern",
      empathy_and_clarity: "Empathy & Clarity",
      evidence_relevance: "Evidence & Grounding",
      next_step_drive: "Call-to-Action & Next Step",
    };

    const dimensions: RubricDimension[] = validDimKeys.map((key) => {
      if (dimMap.has(key)) {
        return dimMap.get(key)!;
      }
      return {
        dimension: key,
        label: defaultLabels[key],
        score: Math.max(1, Math.min(5, Math.round(score / 2))),
        explanation: `Technique evaluation for ${defaultLabels[key].toLowerCase()}.`,
      };
    });

    const keyImprovement = typeof f.keyImprovement === "string" && f.keyImprovement.trim()
      ? f.keyImprovement.trim()
      : (improvements[0] || "Validate buyer hesitation before sharing project specs");

    const suggestedAlternative = typeof f.suggestedAlternative === "string" && f.suggestedAlternative.trim()
      ? f.suggestedAlternative.trim()
      : "I understand your hesitation. Let's look at the verified details together this Saturday.";

    const disclaimer = typeof f.disclaimer === "string" && f.disclaimer.trim()
      ? f.disclaimer.trim()
      : "Subjective coaching scores evaluate conversational technique and adherence to best practices. They do not predict commercial closing probability or client conversion.";

    feedback = {
      score,
      summary,
      strengths,
      concernAddressed,
      dimensions,
      improvements,
      keyImprovement,
      suggestedAlternative,
      disclaimer,
    };
  }

  const scenarioType: RehearsalScenarioType | undefined =
    expectedScenarioType ||
    (typeof r.scenarioType === "string" && (r.scenarioType === "immediate_buyer" || r.scenarioType === "documented_concern")
      ? (r.scenarioType as RehearsalScenarioType)
      : undefined);

  return {
    mode: expectedMode,
    scenarioType,
    customerReply,
    feedback,
  };
}

/**
 * Validate and sanitise a Copilot chat response.
 */
export function validateChatResponse(raw: unknown): Omit<ChatResponse, "meta"> {
  if (!raw) {
    throw new Error("Chat response cannot be null or undefined");
  }

  // Handle plain text response if model failed to output JSON
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) {
      throw new Error("Chat response cannot be an empty string");
    }
    try {
      const parsed = JSON.parse(trimmed);
      return validateChatResponse(parsed);
    } catch {
      return {
        answer: trimmed,
        reply: trimmed,
      };
    }
  }

  if (typeof raw !== "object") {
    throw new Error("Chat response must be an object or string");
  }

  const r = raw as Record<string, unknown>;
  const rawAnswer = (typeof r.answer === "string" && r.answer.trim()) ||
    (typeof r.reply === "string" && r.reply.trim()) ||
    (typeof r.message === "string" && r.message.trim()) ||
    "";

  if (!rawAnswer) {
    throw new Error("Chat response missing required 'answer' or 'reply' field");
  }

  const supportingEvidence = Array.isArray(r.supportingEvidence)
    ? r.supportingEvidence.map(String).map((s) => s.trim()).filter(Boolean)
    : undefined;

  const uncertainties = Array.isArray(r.uncertainties)
    ? r.uncertainties.map(String).map((s) => s.trim()).filter(Boolean)
    : undefined;

  const suggestedNextQuestion = typeof r.suggestedNextQuestion === "string" && r.suggestedNextQuestion.trim()
    ? r.suggestedNextQuestion.trim()
    : undefined;

  return {
    answer: rawAnswer,
    reply: rawAnswer,
    ...(supportingEvidence && supportingEvidence.length > 0 ? { supportingEvidence } : {}),
    ...(uncertainties && uncertainties.length > 0 ? { uncertainties } : {}),
    ...(suggestedNextQuestion ? { suggestedNextQuestion } : {}),
  };
}

const VALID_CATEGORIES: StepCategory[] = [
  "outreach", "discovery", "objection_handling", "site_visit_prep", "proposal", "follow_up", "internal_prep"
];

const VALID_STATUSES: StepStatus[] = [
  "pending", "in_progress", "completed", "skipped", "blocked"
];

const VALID_IMPACTS = ["proceed", "pause", "adapt", "stop"] as const;

/**
 * Validate and sanitise a Lead Momentum Plan response.
 */
export function validatePlanResponse(
  raw: unknown,
  fallbackDefaults?: {
    planId: string;
    leadId: string;
    planVersion: number;
    objective: string;
    objectiveLabel: string;
    communicationFormat: string;
  }
): Omit<PlanResponse, "meta"> {
  if (!raw || typeof raw !== "object") {
    throw new Error("Plan response is not an object");
  }

  const r = raw as Record<string, unknown>;

  const planId = typeof r.planId === "string" && r.planId.length > 0
    ? r.planId
    : fallbackDefaults?.planId || `plan-${Date.now()}`;

  const leadId = typeof r.leadId === "string" && r.leadId.length > 0
    ? r.leadId
    : fallbackDefaults?.leadId || "";

  const planVersion = typeof r.planVersion === "number" && r.planVersion > 0
    ? r.planVersion
    : fallbackDefaults?.planVersion || 1;

  const planTitle = expectString(r, "planTitle");
  const objective = (r.objective as PlanResponse["objective"]) || fallbackDefaults?.objective || "complete_strategy";
  const objectiveLabel = typeof r.objectiveLabel === "string" ? r.objectiveLabel : fallbackDefaults?.objectiveLabel || "Lead Progression Strategy";
  const communicationFormat = (r.communicationFormat as PlanResponse["communicationFormat"]) || fallbackDefaults?.communicationFormat || "whatsapp";
  const leadSituationSummary = expectString(r, "leadSituationSummary");
  const strategyRationale = expectString(r, "strategyRationale");
  const successDefinition = expectString(r, "successDefinition");

  const assumptions = Array.isArray(r.assumptions)
    ? r.assumptions.map(String).filter((s) => s.trim().length > 0)
    : [];

  const unknowns = Array.isArray(r.unknowns)
    ? r.unknowns.map(String).filter((s) => s.trim().length > 0)
    : [];

  if (!Array.isArray(r.steps)) {
    throw new Error("Plan steps must be an array");
  }

  if (r.steps.length < 3 || r.steps.length > 10) {
    throw new Error(`Plan step count must be between 3 and 10 steps, received ${r.steps.length}`);
  }

  const steps: MomentumPlanStep[] = r.steps.map((st: unknown, index: number) => {
    if (!st || typeof st !== "object") {
      throw new Error(`Step at index ${index} is not an object`);
    }
    const s = st as Record<string, unknown>;
    const id = typeof s.id === "string" && s.id.length > 0 ? s.id : `step-${index + 1}`;
    const sequence = typeof s.sequence === "number" ? s.sequence : index + 1;
    const title = expectString(s, "title");
    const category: StepCategory = VALID_CATEGORIES.includes(s.category as StepCategory)
      ? (s.category as StepCategory)
      : "outreach";
    const purpose = expectString(s, "purpose");
    const instructions = expectString(s, "instructions");
    const rationale = typeof s.rationale === "string" ? s.rationale : purpose;
    const supportingEvidence = Array.isArray(s.supportingEvidence) ? s.supportingEvidence.map(String) : [];
    const timing = typeof s.timing === "string" && s.timing.trim().length > 0 ? s.timing : "Today";
    const prerequisites = Array.isArray(s.prerequisites) ? s.prerequisites.map(String) : [];
    const expectedOutcome = typeof s.expectedOutcome === "string" ? s.expectedOutcome : "Customer responds";
    const completionCriteria = typeof s.completionCriteria === "string" ? s.completionCriteria : "Step instructions executed";
    const risksOrUnknowns = Array.isArray(s.risksOrUnknowns) ? s.risksOrUnknowns.map(String) : [];
    const contingency = typeof s.contingency === "string" ? s.contingency : "Reassess lead priority";
    const status: StepStatus = VALID_STATUSES.includes(s.status as StepStatus)
      ? (s.status as StepStatus)
      : "pending";

    let communicationDraft = undefined;
    if (s.communicationDraft && typeof s.communicationDraft === "object") {
      const cd = s.communicationDraft as Record<string, unknown>;
      const channel = ["whatsapp", "email", "call_script"].includes(String(cd.channel))
        ? (String(cd.channel) as "whatsapp" | "email" | "call_script")
        : "whatsapp";
      communicationDraft = {
        channel,
        suggestedTone: typeof cd.suggestedTone === "string" ? cd.suggestedTone : "Professional",
        draft: expectString(cd, "draft"),
        concernAddressed: typeof cd.concernAddressed === "string" ? cd.concernAddressed : "Customer question",
        verificationChecklist: Array.isArray(cd.verificationChecklist) ? cd.verificationChecklist.map(String) : [],
        followUpQuestion: typeof cd.followUpQuestion === "string" ? cd.followUpQuestion : undefined,
        alternativeApproach: typeof cd.alternativeApproach === "string" ? cd.alternativeApproach : undefined,
      };
    }

    const decisionBranches = Array.isArray(s.decisionBranches)
      ? s.decisionBranches
          .filter((db: unknown) => db && typeof db === "object")
          .map((db: unknown) => {
            const b = db as Record<string, unknown>;
            const rawImpact = String(b.planImpact);
            const planImpact = VALID_IMPACTS.includes(rawImpact as typeof VALID_IMPACTS[number])
              ? (rawImpact as typeof VALID_IMPACTS[number])
              : "proceed";
            return {
              condition: typeof b.condition === "string" ? b.condition : "Customer responds",
              triggerEvidence: typeof b.triggerEvidence === "string" ? b.triggerEvidence : "Customer reply",
              recommendedAction: typeof b.recommendedAction === "string" ? b.recommendedAction : "Proceed with next step",
              planImpact,
            };
          })
      : [];

    return {
      id,
      sequence,
      title,
      category,
      purpose,
      instructions,
      rationale,
      supportingEvidence,
      timing,
      prerequisites,
      expectedOutcome,
      completionCriteria,
      risksOrUnknowns,
      contingency,
      status,
      blockedReason: typeof s.blockedReason === "string" ? s.blockedReason : undefined,
      completedAt: typeof s.completedAt === "string" ? s.completedAt : undefined,
      communicationDraft,
      decisionBranches,
    };
  });

  const now = new Date().toISOString();

  return {
    planId,
    leadId,
    planVersion,
    planTitle,
    objective,
    objectiveLabel,
    communicationFormat,
    leadSituationSummary,
    strategyRationale,
    assumptions,
    unknowns,
    successDefinition,
    createdAt: typeof r.createdAt === "string" ? r.createdAt : now,
    updatedAt: now,
    steps,
  };
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

