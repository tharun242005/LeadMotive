// ============================================================================
// SignalDesk — AI Prompt Templates
// ============================================================================
//
// All prompts are defined here in one place so they can be reviewed,
// tuned and explained in the interview. Each prompt:
//
// 1. Sets a clear system role
// 2. Provides lead context
// 3. Requests structured JSON output
// 4. Includes Bengaluru-specific knowledge
//
// Prompts are NOT called directly by the browser — only by route handlers.
// ============================================================================

import type { AnalyzeLeadRequest } from "@/types/ai";
import type { ExtractedObjection } from "@/types/lead";

// ---------------------------------------------------------------------------
// 1. Lead Analysis Prompt
// ---------------------------------------------------------------------------

export function buildAnalysisPrompt(lead: AnalyzeLeadRequest): string {
  return `You are an expert real-estate sales analyst for the Bengaluru, Karnataka (India) property market.

Analyse the following inbound lead and produce a structured JSON assessment.

LEAD DATA:
- Name: ${lead.name}
- Location preference: ${lead.location}
- Property requirement: ${lead.propertyRequirement}
- Budget: ₹${lead.budget > 0 ? lead.budget.toLocaleString("en-IN") : "Not specified"}
- Buying timeline: ${lead.buyingTimeline}
- Customer message: """
${lead.customerMessage}
"""

IMPORTANT CONTEXT:
- All prices are in Indian Rupees (₹). Use lakh (L) and crore (Cr) conventions.
- Bengaluru localities include Whitefield, Sarjapur Road, Hebbal, Yelahanka, Electronic City, HSR Layout, Koramangala, and others.
- Common concerns: traffic, metro connectivity, school proximity, water supply, BBMP/BDA approval.
- Property types: apartment/flat, villa, plot, row house, penthouse, duplex.

Respond with ONLY a JSON object matching this exact structure (no markdown, no extra text):
{
  "summary": "One paragraph summarising this lead's situation, urgency and key motivators",
  "intent": "one of: ready_to_buy | actively_searching | comparing_options | early_research | seeking_information | callback_request | unclear",
  "intentConfidence": 0.0 to 1.0,
  "requirements": [{"label": "short description", "confidence": "explicit or inferred"}],
  "objections": [{"label": "short description", "severity": "high, medium, or low"}],
  "recommendedAction": {
    "type": "one of: call | whatsapp | email | site_visit | follow_up | share_info",
    "description": "what the salesperson should do",
    "timeframe": "e.g. Within 2 hours"
  },
  "suggestedResponse": "A ready-to-send message to the customer, warm and professional, in Indian English",
  "timeline": [
    {"dayOffset": 0, "action": "description", "channel": "call|whatsapp|email|site_visit", "completed": false}
  ]
}

The timeline should have 3-5 touchpoints spanning the customer's buying timeline.
Be specific and actionable. Do not be generic.`;
}

// ---------------------------------------------------------------------------
// 2. Contextual Chat Prompt (Copilot)
// ---------------------------------------------------------------------------

export function buildChatPrompt(
  leadContext: {
    name: string;
    location: string;
    propertyRequirement: string;
    budget: number;
    buyingTimeline: string;
    customerMessage: string;
    analysisSummary: string | null;
  },
  userMessage: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
): string {
  const historyText = history
    .map((m) => `${m.role === "user" ? "Salesperson" : "Coach"}: ${m.content}`)
    .join("\n");

  return `You are an AI sales coach for a real-estate salesperson in Bengaluru, India.

You are helping the salesperson with a specific lead. All your answers must be grounded in this lead's context — do not give generic advice.

LEAD CONTEXT:
- Customer: ${leadContext.name}
- Location: ${leadContext.location}
- Requirement: ${leadContext.propertyRequirement}
- Budget: ₹${leadContext.budget > 0 ? leadContext.budget.toLocaleString("en-IN") : "Not specified"}
- Timeline: ${leadContext.buyingTimeline}
- Customer message: """${leadContext.customerMessage}"""
${leadContext.analysisSummary ? `- AI Analysis: ${leadContext.analysisSummary}` : ""}

${historyText ? `PREVIOUS CONVERSATION:\n${historyText}\n` : ""}

The salesperson asks: "${userMessage}"

Respond helpfully, concisely (2-4 paragraphs max), and specifically to this lead. Use Bengaluru market knowledge. If the salesperson asks to adjust a response tone or content, provide the revised text directly.`;
}

// ---------------------------------------------------------------------------
// 3. Objection Rehearsal Prompt
// ---------------------------------------------------------------------------

export function buildRehearsalPrompt(
  leadContext: {
    name: string;
    location: string;
    propertyRequirement: string;
    budget: number;
    buyingTimeline: string;
    customerMessage: string;
    objections: ExtractedObjection[];
  },
  salespersonMessage: string,
  history: Array<{ role: "salesperson" | "customer"; content: string }>,
  includeFeedback: boolean,
): string {
  const objectionsText = leadContext.objections
    .map((o) => `- ${o.label} (${o.severity} severity)`)
    .join("\n");

  const historyText = history
    .map((m) => `${m.role === "salesperson" ? "Salesperson" : "Customer"}: ${m.content}`)
    .join("\n");

  const feedbackInstructions = includeFeedback
    ? `\n\nAlso provide coaching feedback in this JSON structure:
{
  "customerReply": "your in-character customer response",
  "feedback": {
    "score": 1-10,
    "strengths": ["what the salesperson did well"],
    "improvements": ["what could be better"],
    "suggestedAlternative": "a better version of the salesperson's response"
  }
}

Respond with ONLY the JSON object above, no markdown.`
    : `\n\nRespond with ONLY a JSON object:
{
  "customerReply": "your in-character customer response",
  "feedback": null
}

No markdown, no extra text.`;

  return `You are roleplaying as a potential property buyer in Bengaluru, India. You are speaking with a real-estate salesperson.

Stay in character as the customer throughout. Be realistic — not overly difficult, but not a pushover either. Base your objections and concerns on the lead data below.

CUSTOMER PROFILE:
- Name: ${leadContext.name}
- Looking in: ${leadContext.location}
- Wants: ${leadContext.propertyRequirement}
- Budget: ₹${leadContext.budget > 0 ? leadContext.budget.toLocaleString("en-IN") : "Not specified"}
- Timeline: ${leadContext.buyingTimeline}
- Known objections:
${objectionsText || "- None identified yet"}

${historyText ? `CONVERSATION SO FAR:\n${historyText}\n` : "This is the start of the conversation. The salesperson is initiating contact."}

The salesperson says: "${salespersonMessage}"
${feedbackInstructions}`;
}
