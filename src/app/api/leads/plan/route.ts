import { NextRequest, NextResponse } from "next/server";
import { performLeadPlan } from "@/lib/ai/client";
import type { PlanRequest } from "@/types/ai";
import type { PlanningObjective, CommunicationFormat } from "@/types/lead";

const VALID_OBJECTIVES: PlanningObjective[] = [
  "first_follow_up",
  "address_objection",
  "clarify_requirements",
  "progress_buyer",
  "re_engage_dormant",
  "complete_strategy",
  "custom",
];

const VALID_FORMATS: CommunicationFormat[] = [
  "whatsapp",
  "email",
  "call_script",
  "general_action",
];

export async function POST(req: NextRequest) {
  try {
    const body: PlanRequest = await req.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid JSON request payload" },
        { status: 400 }
      );
    }

    if (!body.lead || typeof body.lead !== "object") {
      return NextResponse.json(
        { error: "Missing required object: lead" },
        { status: 400 }
      );
    }

    if (!body.lead.id || typeof body.lead.id !== "string") {
      return NextResponse.json(
        { error: "Missing required field: lead.id" },
        { status: 400 }
      );
    }

    if (!body.lead.name || typeof body.lead.name !== "string" || !body.lead.name.trim()) {
      return NextResponse.json(
        { error: "Missing required field: lead.name" },
        { status: 400 }
      );
    }

    if (!body.lead.customerMessage || typeof body.lead.customerMessage !== "string") {
      return NextResponse.json(
        { error: "Missing required field: lead.customerMessage" },
        { status: 400 }
      );
    }

    const objective: PlanningObjective = VALID_OBJECTIVES.includes(body.objective)
      ? body.objective
      : "complete_strategy";

    const communicationFormat: CommunicationFormat = VALID_FORMATS.includes(body.communicationFormat)
      ? body.communicationFormat
      : "whatsapp";

    // Bound input sizes to prevent prompt injection or memory exhaustion
    const boundedReq: PlanRequest = {
      lead: {
        id: body.lead.id.trim(),
        name: body.lead.name.trim().slice(0, 100),
        location: (body.lead.location || "").trim().slice(0, 100),
        propertyRequirement: (body.lead.propertyRequirement || "").trim().slice(0, 120),
        budget: typeof body.lead.budget === "number" && !isNaN(body.lead.budget)
          ? Math.max(0, body.lead.budget)
          : 0,
        buyingTimeline: (body.lead.buyingTimeline || "not_specified").trim().slice(0, 50),
        customerMessage: body.lead.customerMessage.trim().slice(0, 4000),
        priority: body.lead.priority
          ? {
              total: typeof body.lead.priority.total === "number" ? body.lead.priority.total : 50,
              band: String(body.lead.priority.band || "warm"),
            }
          : undefined,
        analysis: body.lead.analysis
          ? {
              summary: (body.lead.analysis.summary || "").slice(0, 600),
              intent: (body.lead.analysis.intent || "unclear").slice(0, 50),
              requirements: Array.isArray(body.lead.analysis.requirements)
                ? body.lead.analysis.requirements.slice(0, 6).map((r) => ({ label: String(r.label).slice(0, 80) }))
                : [],
              objections: Array.isArray(body.lead.analysis.objections)
                ? body.lead.analysis.objections.slice(0, 6).map((o) => ({
                    label: String(o.label).slice(0, 80),
                    severity: String(o.severity || "medium").slice(0, 20),
                  }))
                : [],
            }
          : null,
      },
      objective,
      communicationFormat,
      additionalInstructions: body.additionalInstructions
        ? body.additionalInstructions.trim().slice(0, 500)
        : undefined,
      isAdaptation: Boolean(body.isAdaptation),
      previousPlan: body.previousPlan
        ? {
            planId: String(body.previousPlan.planId || "").slice(0, 80),
            planVersion: typeof body.previousPlan.planVersion === "number" ? body.previousPlan.planVersion : 1,
            completedSteps: Array.isArray(body.previousPlan.completedSteps)
              ? body.previousPlan.completedSteps.slice(0, 10)
              : [],
            remainingSteps: Array.isArray(body.previousPlan.remainingSteps)
              ? body.previousPlan.remainingSteps.slice(0, 10)
              : [],
            adaptationReason: body.previousPlan.adaptationReason
              ? String(body.previousPlan.adaptationReason).trim().slice(0, 300)
              : undefined,
          }
        : undefined,
    };

    const plan = await performLeadPlan(boundedReq);
    return NextResponse.json(plan);
  } catch (error) {
    console.error("Error in /api/leads/plan:", error);
    return NextResponse.json(
      {
        error: "Failed to generate momentum plan",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
