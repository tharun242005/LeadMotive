import { NextRequest, NextResponse } from "next/server";
import { performObjectionRehearsal } from "@/lib/ai/client";
import type { RehearsalRequest, RehearsalMode } from "@/types/ai";
import type { ExtractedObjection } from "@/types/lead";

export async function POST(req: NextRequest) {
  try {
    const body: RehearsalRequest = await req.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid JSON request payload", code: "INVALID_INPUT" },
        { status: 400 }
      );
    }

    if (!body.leadContext || typeof body.leadContext !== "object") {
      return NextResponse.json(
        { error: "Missing required field: leadContext", code: "INVALID_INPUT" },
        { status: 400 }
      );
    }

    const mode: RehearsalMode = body.mode === "coach" ? "coach" : "roleplay";
    const scenarioType = body.scenarioType === "immediate_buyer" ? "immediate_buyer" : "documented_concern";
    const isHypothetical = Boolean(body.isHypothetical);
    const rawMessage = typeof body.message === "string" ? body.message.trim() : "";

    const boundedContext = {
      id: typeof body.leadContext.id === "string" ? body.leadContext.id.slice(0, 50) : undefined,
      name: String(body.leadContext.name || "Customer").slice(0, 100),
      location: String(body.leadContext.location || "Bengaluru").slice(0, 100),
      propertyRequirement: String(body.leadContext.propertyRequirement || "Apartment").slice(0, 100),
      budget: typeof body.leadContext.budget === "number" ? body.leadContext.budget : 0,
      buyingTimeline: String(body.leadContext.buyingTimeline || "not_specified").slice(0, 50),
      customerMessage: String(body.leadContext.customerMessage || "").slice(0, 4000),
      objections: Array.isArray(body.leadContext.objections)
        ? body.leadContext.objections.slice(0, 10).map((o) => ({
            label: String(o.label || "").slice(0, 120),
            severity: ["high", "medium", "low"].includes(String(o.severity))
              ? (String(o.severity) as "high" | "medium" | "low")
              : "medium",
            evidenceQuote: typeof o.evidenceQuote === "string" ? o.evidenceQuote.slice(0, 300) : undefined,
            recommendedHandling: typeof o.recommendedHandling === "string" ? o.recommendedHandling.slice(0, 400) : undefined,
          }))
        : [],
      analysis: body.leadContext.analysis && typeof body.leadContext.analysis === "object"
        ? {
            summary: typeof body.leadContext.analysis.summary === "string" ? body.leadContext.analysis.summary.slice(0, 500) : undefined,
            intent: typeof body.leadContext.analysis.intent === "string" ? body.leadContext.analysis.intent.slice(0, 50) : undefined,
            recommendedAction: body.leadContext.analysis.recommendedAction && typeof body.leadContext.analysis.recommendedAction === "object"
              ? {
                  description: String(body.leadContext.analysis.recommendedAction.description || "").slice(0, 200),
                  timeframe: String(body.leadContext.analysis.recommendedAction.timeframe || "").slice(0, 100),
                }
              : undefined,
          }
        : null,
    };

    let targetObjection: ExtractedObjection | undefined = undefined;
    if (body.targetObjection && typeof body.targetObjection === "object") {
      targetObjection = {
        label: String(body.targetObjection.label || "Customer objection").slice(0, 120),
        severity: ["high", "medium", "low"].includes(String(body.targetObjection.severity))
          ? (String(body.targetObjection.severity) as "high" | "medium" | "low")
          : "medium",
        evidenceQuote: typeof body.targetObjection.evidenceQuote === "string"
          ? body.targetObjection.evidenceQuote.slice(0, 300)
          : undefined,
        recommendedHandling: typeof body.targetObjection.recommendedHandling === "string"
          ? body.targetObjection.recommendedHandling.slice(0, 400)
          : undefined,
      };
    } else if (boundedContext.objections.length > 0) {
      targetObjection = boundedContext.objections[0];
    }

    const boundedHistory = Array.isArray(body.history)
      ? body.history
          .filter((m) => m && (m.role === "salesperson" || m.role === "customer") && typeof m.content === "string")
          .slice(-10)
          .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }))
      : [];

    const response = await performObjectionRehearsal(
      rawMessage.slice(0, 2000),
      boundedContext,
      boundedHistory,
      Boolean(body.includeFeedback),
      mode,
      targetObjection,
      scenarioType,
      isHypothetical
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in /api/leads/rehearsal:", error);
    return NextResponse.json(
      {
        error: "Failed to process rehearsal request",
        code: "UNEXPECTED_SERVER_ERROR",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
