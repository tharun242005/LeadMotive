// ============================================================================
// SignalDesk — Server-Side AI Client (Google Gemini & Heuristic Engine)
// ============================================================================
//
// Centralized server-side AI execution.
// - GEMINI_API_KEY: server-side secret (never exposed to browser)
// - GEMINI_MODEL: server-side model configuration with default "gemini-3.8-flash"
//
// Unambiguous telemetry:
// - Live mode: provider="google-gemini", mode="live", fallbackUsed=false, model="gemini-3.8-flash"
// - Fallback mode: provider="offline-heuristic", mode="fallback", fallbackUsed=true, model=null
// ============================================================================

import type {
  AnalyzeLeadRequest,
  AnalyzeLeadResponse,
  ChatResponse,
  RehearsalResponse,
  RehearsalMode,
  PlanRequest,
  PlanResponse,
  AIMetadata,
  DiagnosticsResponse,
} from "@/types/ai";
import type {
  ExtractedObjection,
  MomentumPlanStep,
} from "@/types/lead";

import { GoogleGenAI } from "@google/genai";
import {
  buildAnalysisPrompt,
  buildChatPrompt,
  buildRehearsalPrompt,
  buildPlanPrompt,
  buildAdaptPlanPrompt,
  generateFallbackChat,
  generateFallbackRehearsal,
  generateFallbackAnalysis,
} from "./prompts";
export { generateFallbackChat, generateFallbackRehearsal, generateFallbackAnalysis } from "./prompts";
import {
  validateAnalysisResponse,
  validateRehearsalResponse,
  validatePlanResponse,
  validateChatResponse,
} from "./schemas";
import { SEEDED_MOMENTUM_PLANS } from "@/lib/leads/momentum-fixtures";

export const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";

let genAIClient: GoogleGenAI | null = null;
let currentApiKey: string | null = null;

function getGenAIClient(apiKey: string): GoogleGenAI {
  if (!genAIClient || currentApiKey !== apiKey) {
    genAIClient = new GoogleGenAI({ apiKey });
    currentApiKey = apiKey;
  }
  return genAIClient;
}

export interface AIClientConfig {
  apiKey?: string;
  model: string;
  isConfigured: boolean;
}

/**
 * Read server-side AI configuration.
 * Strictly reads from server environment variables — no browser exposure.
 */
export function getAIConfig(): AIClientConfig {
  const apiKey =
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_GEMINI_API_KEY?.trim();

  const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;

  const isConfigured = Boolean(
    apiKey && apiKey.length > 5 && apiKey !== "your_api_key_here"
  );

  return {
    apiKey: isConfigured ? apiKey : undefined,
    model,
    isConfigured,
  };
}

/**
 * Call Google Gemini using official @google/genai SDK.
 * Includes JSON mode and automatic markdown code fence stripping.
 */
async function callGeminiRaw(
  prompt: string,
  options?: {
    jsonMode?: boolean;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<{ text: string; model: string }> {
  const config = getAIConfig();
  if (!config.isConfigured || !config.apiKey) {
    throw new Error("GEMINI_API_KEY is not configured on the server");
  }

  const model = config.model;

  try {
    const ai = getGenAIClient(config.apiKey);
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: options?.temperature ?? 0.2,
        ...(options?.maxTokens ? { maxOutputTokens: options.maxTokens } : {}),
        ...(options?.jsonMode ? { responseMimeType: "application/json" } : {}),
      },
    });

    const rawText = response.text;
    if (!rawText) {
      throw new Error("Empty content returned by Gemini API");
    }

    // Strip markdown code fences if wrapped
    const cleaned = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    return { text: cleaned, model };
  } catch (sdkErr: unknown) {
    const msg = sdkErr instanceof Error ? sdkErr.message : String(sdkErr);
    throw new Error(`Google GenAI SDK error: ${msg}`);
  }
}

// ---------------------------------------------------------------------------
// High-Level Service Methods
// ---------------------------------------------------------------------------

/**
 * Analyze lead with live Gemini, or fall back explicitly to heuristic engine.
 */
export async function performLeadAnalysis(lead: AnalyzeLeadRequest): Promise<AnalyzeLeadResponse> {
  const start = performance.now();
  const config = getAIConfig();

  if (config.isConfigured) {
    try {
      const prompt = buildAnalysisPrompt(lead);
      const { text, model } = await callGeminiRaw(prompt, { jsonMode: true, maxTokens: 1500 });
      const parsed = JSON.parse(text);
      const validated = validateAnalysisResponse(parsed, lead);
      const latencyMs = Math.round(performance.now() - start);

      const meta: AIMetadata = {
        provider: "google-gemini",
        model,
        mode: "live",
        fallbackUsed: false,
        latencyMs,
      };

      return {
        ...validated,
        meta,
      };
    } catch (err) {
      console.warn("Live Gemini analysis call failed, falling back to heuristic engine:", err);
      const latencyMs = Math.round(performance.now() - start);
      const fallback = generateFallbackAnalysis(lead);
      const meta: AIMetadata = {
        provider: "offline-heuristic",
        model: null,
        mode: "fallback",
        fallbackUsed: true,
        latencyMs,
        message: err instanceof Error ? err.message : "Live Gemini call failed",
      };
      return {
        ...fallback,
        meta,
      };
    }
  }

  // Unconfigured: use explicit offline heuristic assistance
  const latencyMs = Math.round(performance.now() - start);
  const fallback = generateFallbackAnalysis(lead);
  const meta: AIMetadata = {
    provider: "offline-heuristic",
    model: null,
    mode: "fallback",
    fallbackUsed: true,
    latencyMs,
    message: "Server GEMINI_API_KEY unconfigured. Showing offline heuristic preview.",
  };

  return {
    ...fallback,
    meta,
  };
}

/**
 * Contextual sales coach chat with live Gemini or explicit fallback.
 */
export async function performCopilotChat(
  message: string,
  leadContext: {
    id?: string;
    name: string;
    location: string;
    propertyRequirement: string;
    budget: number;
    buyingTimeline: string;
    customerMessage: string;
    priority?: {
      total: number;
      band: string;
    };
    analysis?: {
      summary?: string;
      intent?: string;
      requirements?: Array<{ label: string }>;
      objections?: Array<{ label: string; severity?: string; recommendedHandling?: string }>;
      recommendedAction?: { description: string; timeframe: string };
      suggestedResponse?: string;
      missingInformation?: string[];
    } | null;
    analysisSummary?: string | null;
  },
  history: Array<{ role: "user" | "assistant"; content: string }>
): Promise<ChatResponse> {
  const start = performance.now();
  const config = getAIConfig();
  // Bound history to last 6 messages to prevent unbounded token usage
  const boundedHistory = (history || []).slice(-6);

  if (config.isConfigured) {
    try {
      const prompt = buildChatPrompt(leadContext, message.slice(0, 2000), boundedHistory);
      const { text, model } = await callGeminiRaw(prompt, { jsonMode: true, temperature: 0.3 });
      const validated = validateChatResponse(text);
      const latencyMs = Math.round(performance.now() - start);

      return {
        ...validated,
        reply: validated.answer,
        meta: {
          provider: "google-gemini",
          model,
          mode: "live",
          fallbackUsed: false,
          latencyMs,
        },
      };
    } catch (err) {
      console.warn("Live Gemini chat failed, using fallback:", err);
      const latencyMs = Math.round(performance.now() - start);
      const fallback = generateFallbackChat(message, leadContext);

      return {
        ...fallback,
        reply: fallback.answer,
        meta: {
          provider: "offline-heuristic",
          model: null,
          mode: "fallback",
          fallbackUsed: true,
          latencyMs,
          message: err instanceof Error ? err.message : "Live Gemini call failed",
        },
      };
    }
  }

  const latencyMs = Math.round(performance.now() - start);
  const fallback = generateFallbackChat(message, leadContext);

  return {
    ...fallback,
    reply: fallback.answer,
    meta: {
      provider: "offline-heuristic",
      model: null,
      mode: "fallback",
      fallbackUsed: true,
      latencyMs,
      message: "Server GEMINI_API_KEY unconfigured. Generated via offline heuristic engine.",
    },
  };
}

/**
 * Objection rehearsal roleplay with live Gemini or explicit fallback.
 */
export async function performObjectionRehearsal(
  message: string,
  leadContext: {
    id?: string;
    name: string;
    location: string;
    propertyRequirement: string;
    budget: number;
    buyingTimeline: string;
    customerMessage: string;
    objections: ExtractedObjection[];
    analysis?: {
      summary?: string;
      intent?: string;
    } | null;
  },
  history: Array<{ role: "salesperson" | "customer"; content: string }>,
  includeFeedback: boolean,
  mode: RehearsalMode = "roleplay",
  targetObjection?: ExtractedObjection
): Promise<RehearsalResponse> {
  const start = performance.now();
  const config = getAIConfig();
  const boundedHistory = (history || []).slice(-6);

  if (config.isConfigured) {
    try {
      const prompt = buildRehearsalPrompt(
        leadContext,
        message.slice(0, 2000),
        boundedHistory,
        includeFeedback,
        mode,
        targetObjection
      );
      const temperature = mode === "coach" || includeFeedback ? 0.2 : 0.4;
      const { text, model } = await callGeminiRaw(prompt, { jsonMode: true, temperature });
      const parsed = JSON.parse(text);
      const validated = validateRehearsalResponse(parsed, mode);
      const latencyMs = Math.round(performance.now() - start);

      return {
        ...validated,
        mode,
        meta: {
          provider: "google-gemini",
          model,
          mode: "live",
          fallbackUsed: false,
          latencyMs,
        },
      };
    } catch (err) {
      console.warn("Live Gemini rehearsal failed, using fallback:", err);
      const latencyMs = Math.round(performance.now() - start);
      const fallback = generateFallbackRehearsal(
        message,
        leadContext,
        boundedHistory,
        includeFeedback,
        mode,
        targetObjection
      );

      return {
        ...fallback,
        mode,
        meta: {
          provider: "offline-heuristic",
          model: null,
          mode: "fallback",
          fallbackUsed: true,
          latencyMs,
          message: err instanceof Error ? err.message : "Live Gemini call failed",
        },
      };
    }
  }

  const latencyMs = Math.round(performance.now() - start);
  const fallback = generateFallbackRehearsal(
    message,
    leadContext,
    boundedHistory,
    includeFeedback,
    mode,
    targetObjection
  );

  return {
    ...fallback,
    mode,
    meta: {
      provider: "offline-heuristic",
      model: null,
      mode: "fallback",
      fallbackUsed: true,
      latencyMs,
      message: "Server GEMINI_API_KEY unconfigured. Generated via offline heuristic engine.",
    },
  };
}

/**
 * Generate or adapt a Lead Momentum Plan with live Gemini or explicit heuristic fallback.
 */
export async function performLeadPlan(req: PlanRequest): Promise<PlanResponse> {
  const start = performance.now();
  const config = getAIConfig();

  const planId = req.previousPlan?.planId || `plan-${req.lead.id}-${Date.now()}`;
  const planVersion = req.previousPlan ? req.previousPlan.planVersion + 1 : 1;

  if (config.isConfigured) {
    try {
      const prompt =
        req.isAdaptation && req.previousPlan
          ? buildAdaptPlanPrompt({
              lead: {
                id: req.lead.id,
                name: req.lead.name,
                location: req.lead.location,
                propertyRequirement: req.lead.propertyRequirement,
                budget: req.lead.budget,
                buyingTimeline: req.lead.buyingTimeline,
                customerMessage: req.lead.customerMessage,
              },
              previousPlan: {
                planId: req.previousPlan.planId,
                planVersion: req.previousPlan.planVersion,
                planTitle: `Momentum Plan v${req.previousPlan.planVersion}`,
                objective: req.objective,
                completedSteps: req.previousPlan.completedSteps,
                remainingSteps: req.previousPlan.remainingSteps,
                adaptationReason: req.previousPlan.adaptationReason,
              },
              additionalInstructions: req.additionalInstructions,
            })
          : buildPlanPrompt({
              lead: req.lead,
              objective: req.objective,
              communicationFormat: req.communicationFormat,
              additionalInstructions: req.additionalInstructions,
            });

      const { text, model } = await callGeminiRaw(prompt, { jsonMode: true, temperature: 0.3 });
      const parsed = JSON.parse(text);
      const validated = validatePlanResponse(parsed, {
        planId,
        leadId: req.lead.id,
        planVersion,
        objective: req.objective,
        objectiveLabel: req.objective.replace(/_/g, " "),
        communicationFormat: req.communicationFormat,
      });

      const latencyMs = Math.round(performance.now() - start);
      return {
        ...validated,
        meta: {
          provider: "google-gemini",
          model,
          mode: "live",
          fallbackUsed: false,
          latencyMs,
        },
      };
    } catch (err) {
      console.warn("Live Gemini plan generation failed, falling back to heuristic engine:", err);
      const latencyMs = Math.round(performance.now() - start);
      const fallback = generateFallbackPlan(req, planId, planVersion);
      return {
        ...fallback,
        meta: {
          provider: "offline-heuristic",
          model: null,
          mode: "fallback",
          fallbackUsed: true,
          latencyMs,
          message: err instanceof Error ? err.message : "Live Gemini call failed",
        },
      };
    }
  }

  // Unconfigured: explicit offline heuristic engine
  const latencyMs = Math.round(performance.now() - start);
  const fallback = generateFallbackPlan(req, planId, planVersion);
  return {
    ...fallback,
    meta: {
      provider: "offline-heuristic",
      model: null,
      mode: "fallback",
      fallbackUsed: true,
      latencyMs,
      message: "Server GEMINI_API_KEY unconfigured. Generated via offline heuristic engine.",
    },
  };
}

/**
 * Developer diagnostic ping to test server AI connectivity.
 * Never reveals the raw API key.
 */
export async function checkServerDiagnostics(): Promise<DiagnosticsResponse> {
  const config = getAIConfig();

  if (!config.isConfigured) {
    return {
      configured: false,
      model: config.model,
      tested: false,
      status: "unconfigured",
      message: "GEMINI_API_KEY is not set in server environment variables.",
    };
  }

  const start = performance.now();
  try {
    const { text, model } = await callGeminiRaw("Reply with 'READY'", {
      jsonMode: false,
      temperature: 0.0,
    });
    const latencyMs = Math.round(performance.now() - start);

    return {
      configured: true,
      model,
      tested: true,
      status: "ready",
      latencyMs,
      message: `Successfully connected to ${model} (${latencyMs}ms). Response: ${text.slice(0, 20)}`,
    };
  } catch (err) {
    const latencyMs = Math.round(performance.now() - start);
    return {
      configured: true,
      model: config.model,
      tested: true,
      status: "error",
      latencyMs,
      message: err instanceof Error ? err.message : "Connection test failed",
    };
  }
}





/**
 * Deterministic offline heuristic engine for Lead Momentum Plans.
 * Never reports fake live AI — explicitly tagged as fallback heuristic.
 * Ensures dynamic length (3 to 10 steps), grounded drafts, and decision branches.
 */
function generateFallbackPlan(
  req: PlanRequest,
  planId: string,
  planVersion: number
): Omit<PlanResponse, "meta"> {
  const lead = req.lead;
  const now = new Date().toISOString();
  const firstName = lead.name.split(" ")[0] || "Customer";

  // Check if this is an adaptation of an existing plan
  if (req.isAdaptation && req.previousPlan) {
    const completed = req.previousPlan.completedSteps || [];
    const reason = req.previousPlan.adaptationReason || req.additionalInstructions || "Customer context update";
    
    // Generate 2 to 3 adaptive remaining steps
    const nextSeq = completed.length + 1;
    const adaptiveRemaining: MomentumPlanStep[] = [
      {
        id: `step-adapt-${nextSeq}`,
        sequence: nextSeq,
        title: `Address Shift: ${reason.slice(0, 40)}`,
        category: "objection_handling",
        purpose: "Align with the customer's updated timeline or requirements without resetting prior rapport.",
        instructions: `Acknowledge the change mentioned by ${firstName}. Revise unit recommendations or financing assumptions accordingly.`,
        rationale: "Adapting directly to customer feedback preserves trust and keeps momentum alive.",
        supportingEvidence: [`Customer adaptation trigger: "${reason}"`],
        timing: "Within 24 hours",
        prerequisites: completed.length > 0 ? [`Step ${completed.length} completed`] : [],
        expectedOutcome: "Customer confirms revised expectations and re-engages.",
        completionCriteria: "Updated proposal or clarification delivered.",
        risksOrUnknowns: ["Customer may need additional time to review with family."],
        contingency: "Schedule a brief checkpoint call in 48 hours.",
        status: "pending",
        communicationDraft: {
          channel: req.communicationFormat === "general_action" ? "whatsapp" : req.communicationFormat,
          suggestedTone: "Adaptive, attentive, and solutions-focused",
          draft: `Hi ${firstName}, thank you for updating me. I completely understand this adjustment regarding ${reason.slice(0, 50)}. I have recalculated our recommendations to fit your revised criteria so you have total clarity. Would you like me to share the updated options over WhatsApp or do a quick 5-minute call?`,
          concernAddressed: reason,
          verificationChecklist: ["Verify updated inventory constraints", "Confirm pricing revisions"],
        },
        decisionBranches: [
          {
            condition: "Customer responds positively to revised approach",
            triggerEvidence: "Customer asks for new options or timeline",
            recommendedAction: "Deliver tailored shortlist and propose next milestone",
            planImpact: "proceed",
          },
          {
            condition: "Customer asks to pause for 2 weeks",
            triggerEvidence: "Customer requests time",
            recommendedAction: "Respect timeline and set reminder for scheduled follow-up",
            planImpact: "pause",
          },
        ],
      },
      {
        id: `step-adapt-${nextSeq + 1}`,
        sequence: nextSeq + 1,
        title: "Milestone Review & Next Action Confirmation",
        category: "proposal",
        purpose: "Lock in the appropriate next progression step (site walkthrough or formal cost sheet).",
        instructions: `Coordinate with ${firstName} to establish the definitive next step once the adapted requirements are validated.`,
        rationale: "Ensures the deal moves forward systematically rather than drifting into indefinite delay.",
        supportingEvidence: [`Lead requirement: ${lead.propertyRequirement}`],
        timing: "Day 3 following adaptation",
        prerequisites: [`Step ${nextSeq} completed`],
        expectedOutcome: "Next milestone (visit or token) scheduled.",
        completionCriteria: "Calendar commitment or formal feedback captured.",
        risksOrUnknowns: ["External market comparisons."],
        contingency: "Provide comparative analysis against alternative projects in the corridor.",
        status: "pending",
        decisionBranches: [
          {
            condition: "Customer ready to advance",
            triggerEvidence: "Confirms appointment or requests booking terms",
            recommendedAction: "Prepare reservation documentation",
            planImpact: "proceed",
          },
        ],
      },
    ];

    const allSteps = [...completed, ...adaptiveRemaining];
    // Re-index sequences
    const reindexedSteps = allSteps.map((s, idx) => ({ ...s, sequence: idx + 1 }));

    return {
      planId,
      leadId: lead.id,
      planVersion,
      planTitle: `Adapted Momentum Plan (v${planVersion}) — ${lead.name}`,
      objective: req.objective,
      objectiveLabel: req.objective.replace(/_/g, " "),
      communicationFormat: req.communicationFormat,
      additionalInstructions: req.additionalInstructions,
      leadSituationSummary: `Plan adapted from Version ${req.previousPlan.planVersion}. ${completed.length} step(s) completed. Revised to address: ${reason}.`,
      strategyRationale: "Preserved completed progress and replaced pending steps with targeted actions reflecting current customer signals.",
      assumptions: ["Completed steps established baseline rapport.", "Customer remains in active market."],
      unknowns: ["Impact of revised timeline on initial budget."],
      successDefinition: "Customer re-engages and confirms revised next milestone without deal stall.",
      createdAt: now,
      updatedAt: now,
      steps: reindexedSteps,
    };
  }

  // Canonical Seed Match (if no custom edits requested)
  if (SEEDED_MOMENTUM_PLANS[lead.id] && !req.additionalInstructions) {
    const canonical = SEEDED_MOMENTUM_PLANS[lead.id];
    return {
      ...canonical,
      planId,
      planVersion: 1,
      objective: req.objective,
      communicationFormat: req.communicationFormat,
      createdAt: now,
      updatedAt: now,
    };
  }

  // Dynamic Heuristic Plan for Custom or Seed Leads
  const timeline = lead.buyingTimeline;
  const isUrgent = timeline === "immediate";
  const isSparse = !lead.budget || lead.budget === 0 || timeline === "not_specified";
  const isLongTerm = timeline === "beyond_12_months" || timeline === "6_to_12_months";

  let strategyType = "standard";

  if (isUrgent) {
    strategyType = "fast_track_visit";
  } else if (isSparse) {
    strategyType = "discovery_qualification";
  } else if (lead.budget > 15000000 || timeline === "3_to_6_months") {
    strategyType = "detailed_evaluation";
  } else if (isLongTerm) {
    strategyType = "nurture_qualification";
  }

  const steps: MomentumPlanStep[] = [];

  if (strategyType === "fast_track_visit") {
    // 4 Steps: Fast-track site visit
    steps.push({
      id: "step-1",
      sequence: 1,
      title: "Deliver Value Dossier & Propose Walkthrough",
      category: "outreach",
      purpose: "Acknowledge urgency and offer immediate model residence inspection.",
      instructions: `Contact ${firstName} via ${req.communicationFormat}. Provide 2 specific walkthrough slots within 48 hours.`,
      rationale: "Immediate timeline buyers choose the sales rep who demonstrates speed and readiness.",
      supportingEvidence: [`Customer message: "${lead.customerMessage.slice(0, 80)}..."`, `Timeline: ${timeline}`],
      timing: "Today (within 2 hours)",
      prerequisites: ["Verify unit key availability"],
      expectedOutcome: "Customer selects walkthrough slot.",
      completionCriteria: "Outreach logged and appointment booked.",
      risksOrUnknowns: ["Buyer comparing multiple projects simultaneously."],
      contingency: "Offer flexible weekend or evening slot.",
      status: "pending",
      communicationDraft: {
        channel: req.communicationFormat === "general_action" ? "whatsapp" : req.communicationFormat,
        suggestedTone: "Direct, professional, and responsive",
        draft: `Hi ${firstName}, thank you for reaching out regarding ${lead.propertyRequirement} in ${lead.location}. Given your immediate timeline, I'd love to arrange a private walkthrough of our matching units this weekend. I have slots open Saturday at 11 AM and 3 PM. Which works best for you?`,
        concernAddressed: "Immediate purchase timeline and unit availability.",
        verificationChecklist: ["Confirm ready unit keys", "Verify current price sheet"],
      },
      decisionBranches: [
        {
          condition: "Customer confirms visit",
          triggerEvidence: "Slot agreed",
          recommendedAction: "Send calendar invite and site location pin",
          planImpact: "proceed",
        },
        {
          condition: "Customer asks for pricing first",
          triggerEvidence: "Requests cost sheet before visiting",
          recommendedAction: "Send transparent summary and reiterate layout inspection value",
          planImpact: "adapt",
        },
      ],
    });

    steps.push({
      id: "step-2",
      sequence: 2,
      title: "Curate Matching Unit Options & Pricing Pack",
      category: "internal_prep",
      purpose: "Prepare 2 best-fit units strictly within budget before the visit.",
      instructions: "Flag 2 specific configurations matching layout and budget specifications.",
      rationale: "Prevents choice paralysis and keeps the visit focused on closing.",
      supportingEvidence: [`Budget: ₹${lead.budget.toLocaleString("en-IN")}`],
      timing: "Day before visit",
      prerequisites: ["Step 1 completed"],
      expectedOutcome: "Printed floorplans and cost sheets ready.",
      completionCriteria: "Units reserved with site manager.",
      risksOrUnknowns: ["Inventory changes."],
      contingency: "Keep a secondary floor unit as backup.",
      status: "pending",
    });

    steps.push({
      id: "step-3",
      sequence: 3,
      title: "Host Focused Model Unit Walkthrough",
      category: "site_visit_prep",
      purpose: "Conduct physical tour highlighting key customer priorities.",
      instructions: `Walk ${firstName} through the living area, kitchen ventilation, and master bedroom layout.`,
      rationale: "Physical inspection turns interest into emotional commitment.",
      supportingEvidence: [`Property requirement: ${lead.propertyRequirement}`],
      timing: "Scheduled visit day",
      prerequisites: ["Step 2 completed"],
      expectedOutcome: "Customer identifies preferred unit.",
      completionCriteria: "Walkthrough completed and feedback documented.",
      risksOrUnknowns: ["Objections on layout or orientation."],
      contingency: "Show alternative facing unit in adjacent tower.",
      status: "pending",
      decisionBranches: [
        {
          condition: "High interest shown",
          triggerEvidence: "Asks about payment schedule",
          recommendedAction: "Present booking token terms with 7-day price lock",
          planImpact: "proceed",
        },
      ],
    });

    steps.push({
      id: "step-4",
      sequence: 4,
      title: "Transparent Cost Breakdown & Token Reservation",
      category: "proposal",
      purpose: "Deliver complete line-by-line pricing and secure reservation.",
      instructions: "Deliver written cost sheet including base price, GST, registration, and maintenance corpus.",
      rationale: "Price transparency prevents buyer remorse and competitor undercutting.",
      supportingEvidence: [`Budget: ₹${lead.budget.toLocaleString("en-IN")}`],
      timing: "Within 24 hours of visit",
      prerequisites: ["Step 3 completed"],
      expectedOutcome: "Booking deposit submitted.",
      completionCriteria: "Token receipt issued.",
      risksOrUnknowns: ["Bank loan approval timeline."],
      contingency: "Offer loan desk assistance.",
      status: "pending",
    });
  } else if (strategyType === "discovery_qualification") {
    // 3 Steps: Discovery and qualification with stopping rule
    steps.push({
      id: "step-1",
      sequence: 1,
      title: "Prompt Qualification Contact",
      category: "outreach",
      purpose: "Qualify budget, timeline, and configuration preferences.",
      instructions: `Contact ${firstName} to clarify missing parameters.`,
      rationale: "Cannot build an accurate proposal without knowing budget and timeframe.",
      supportingEvidence: [`Customer message: "${lead.customerMessage.slice(0, 60)}..."`],
      timing: "Within 2 hours",
      prerequisites: ["Check locality inventory overview"],
      expectedOutcome: "Budget envelope and purchase intent clarified.",
      completionCriteria: "Qualification notes saved.",
      risksOrUnknowns: ["Customer unwilling to disclose budget."],
      contingency: "Provide 2 bracket examples (e.g. ₹80L vs ₹1.2 Cr) to gauge reaction.",
      status: "pending",
      communicationDraft: {
        channel: req.communicationFormat === "general_action" ? "whatsapp" : req.communicationFormat,
        suggestedTone: "Helpful, non-intrusive, and consultative",
        draft: `Hi ${firstName}, thank you for contacting SignalDesk about homes in ${lead.location}. To ensure I share options that genuinely fit what you're looking for, could you share what budget range and timeline you're planning for? We have options ranging across configurations.`,
        concernAddressed: "Missing budget and timeline qualification.",
        verificationChecklist: ["Locality price bands in " + lead.location],
      },
      decisionBranches: [
        {
          condition: "Customer clarifies budget and timeline",
          triggerEvidence: "Budget range provided",
          recommendedAction: "Curate tailored 2-unit shortlist",
          planImpact: "proceed",
        },
        {
          condition: "Customer remains unresponsive after 2 attempts",
          triggerEvidence: "No response in 72 hours",
          recommendedAction: "Move to monthly newsletter nurture and stop active calls",
          planImpact: "stop",
        },
      ],
    });

    steps.push({
      id: "step-2",
      sequence: 2,
      title: "Deliver Curated Correlated Options",
      category: "discovery",
      purpose: "Share 2 targeted property sheets based on qualification answers.",
      instructions: "Send layout and pricing overview.",
      rationale: "Shows respect for their stated preferences.",
      supportingEvidence: [`Requirement: ${lead.propertyRequirement}`],
      timing: "Within 24 hours of qualification",
      prerequisites: ["Step 1 completed"],
      expectedOutcome: "Customer narrows choice to 1 option.",
      completionCriteria: "Digital deck delivered and opened.",
      risksOrUnknowns: ["Customer not ready for physical visits."],
      contingency: "Offer 3D virtual walkthrough video.",
      status: "pending",
    });

    steps.push({
      id: "step-3",
      sequence: 3,
      title: "Checkpoint Follow-Up & Respectful Stopping Condition",
      category: "follow_up",
      purpose: "Establish clear next milestone or gracefully transition to automated nurture.",
      instructions: "Check if customer reviewed options. If interested, schedule visit. If silent, apply stopping rule.",
      rationale: "Protects sales bandwidth from dead ends while leaving door open.",
      supportingEvidence: ["Initial exploratory inquiry"],
      timing: "Day 5",
      prerequisites: ["Step 2 completed"],
      expectedOutcome: "Clear disposition: active pursuit or long-term nurture.",
      completionCriteria: "CRM status updated.",
      risksOrUnknowns: ["Unresponsive contact."],
      contingency: "Do not harass; send final polite invitation to reconnect when ready.",
      status: "pending",
      decisionBranches: [
        {
          condition: "Customer non-responsive",
          triggerEvidence: "No reply to 2 follow-ups",
          recommendedAction: "Apply stopping condition: close active plan and assign to drip marketing",
          planImpact: "stop",
        },
      ],
    });
  } else {
    // 5 Steps: Standard Comprehensive Progression
    steps.push({
      id: "step-1",
      sequence: 1,
      title: "Personalized Initial Outreach & Needs Confirmation",
      category: "outreach",
      purpose: "Validate specific requirements and establish rapport.",
      instructions: `Reach out to ${firstName} via ${req.communicationFormat} addressing their stated criteria.`,
      rationale: "Establishes professional credibility and confirms requirements.",
      supportingEvidence: [`Requirement: ${lead.propertyRequirement}`, `Location: ${lead.location}`],
      timing: "Within 4 hours",
      prerequisites: ["Review project master plan"],
      expectedOutcome: "Customer confirms availability for dialogue.",
      completionCriteria: "Message sent and logged.",
      risksOrUnknowns: ["Customer busy during workday."],
      contingency: "Suggest evening follow-up.",
      status: "pending",
      communicationDraft: {
        channel: req.communicationFormat === "general_action" ? "whatsapp" : req.communicationFormat,
        suggestedTone: "Professional, warm, and knowledgeable",
        draft: `Hi ${firstName}, I'm reviewing your inquiry for ${lead.propertyRequirement} in ${lead.location}. We have matching inventory that aligns closely with your ₹${(lead.budget / 100000).toFixed(0)} Lakh budget. I've prepared a brief overview of current availability and would love to share it with you. Would WhatsApp or a brief call be more convenient?`,
        concernAddressed: "Initial requirement alignment.",
        verificationChecklist: ["Available inventory in " + lead.location],
      },
    });

    steps.push({
      id: "step-2",
      sequence: 2,
      title: "Deliver Comparative Information Pack",
      category: "discovery",
      purpose: "Provide verified floor plans, master layout, and approvals summary.",
      instructions: "Send customized PDF pack with RERA number, floorplans, and locality highlights.",
      rationale: "Gives customer concrete material to review with family.",
      supportingEvidence: [`Location: ${lead.location}`],
      timing: "Day 2",
      prerequisites: ["Step 1 completed"],
      expectedOutcome: "Customer reviews pack and raises specific questions.",
      completionCriteria: "Information pack delivered.",
      risksOrUnknowns: ["Competitor comparisons."],
      contingency: "Highlight specific construction quality and builder track record.",
      status: "pending",
    });

    steps.push({
      id: "step-3",
      sequence: 3,
      title: "Propose & Schedule Targeted Site Walkthrough",
      category: "site_visit_prep",
      purpose: "Transition digital interest into on-ground site visit.",
      instructions: "Offer 2 specific visit slots (morning vs afternoon).",
      rationale: "Physical site visits increase conversion rate fourfold.",
      supportingEvidence: [`Timeline: ${timeline}`],
      timing: "Day 4",
      prerequisites: ["Step 2 completed"],
      expectedOutcome: "Site visit confirmed on calendar.",
      completionCriteria: "Visit logged with site reception.",
      risksOrUnknowns: ["Customer postpones due to personal schedule."],
      contingency: "Offer virtual 3D tour as intermediary step.",
      status: "pending",
    });

    steps.push({
      id: "step-4",
      sequence: 4,
      title: "Conduct On-Site Experience & Address Key Objections",
      category: "site_visit_prep",
      purpose: "Walk selected units and resolve specific concerns.",
      instructions: "Inspect unit, common amenities, and explain possession roadmap.",
      rationale: "Face-to-face interaction allows immediate objection resolution.",
      supportingEvidence: [`Requirement: ${lead.propertyRequirement}`],
      timing: "Scheduled visit day",
      prerequisites: ["Step 3 completed"],
      expectedOutcome: "Customer selects preferred unit.",
      completionCriteria: "Walkthrough completed.",
      risksOrUnknowns: ["Concern regarding maintenance fees or payment stages."],
      contingency: "Walk through builder standard payment milestones.",
      status: "pending",
    });

    steps.push({
      id: "step-5",
      sequence: 5,
      title: "Deliver Final Pricing & Closing Proposal",
      category: "proposal",
      purpose: "Present all-inclusive cost sheet and secure booking token.",
      instructions: "Deliver formal cost sheet with time-limited booking incentive.",
      rationale: "Clear commercial terms encourage timely decision making.",
      supportingEvidence: [`Budget: ₹${lead.budget.toLocaleString("en-IN")}`],
      timing: "Within 48 hours of visit",
      prerequisites: ["Step 4 completed"],
      expectedOutcome: "Booking deposit secured.",
      completionCriteria: "Agreement signed.",
      risksOrUnknowns: ["Legal clearance review delay."],
      contingency: "Provide builder legal search report from recognized advocate.",
      status: "pending",
    });
  }

  return {
    planId,
    leadId: lead.id,
    planVersion,
    planTitle: `Lead Momentum Plan — ${lead.name}`,
    objective: req.objective,
    objectiveLabel: req.objective.replace(/_/g, " "),
    communicationFormat: req.communicationFormat,
    additionalInstructions: req.additionalInstructions,
    leadSituationSummary: `${lead.name} is seeking ${lead.propertyRequirement} in ${lead.location} with a budget of ₹${(lead.budget / 100000).toFixed(0)}L and ${timeline} timeline. Strategy: ${strategyType.replace(/_/g, " ")}.`,
    strategyRationale: `Generated ${steps.length} sequential steps tailored specifically to ${lead.name}'s urgency level (${timeline}) and stated requirements.`,
    assumptions: ["Customer is genuine property buyer.", "Contact details are verified."],
    unknowns: ["Specific financing pre-approval status.", "Family decision-making timeline."],
    successDefinition: "Guide customer systematically through qualification, walkthrough, and reservation without friction.",
    createdAt: now,
    updatedAt: now,
    steps,
  };
}

