import { NextRequest, NextResponse } from "next/server";
import { performCopilotChat } from "@/lib/ai/client";
import type { ChatRequest, AIErrorResponse } from "@/types/ai";

export async function POST(req: NextRequest) {
  const start = performance.now();
  try {
    let body: ChatRequest;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          error: "Invalid JSON in request body",
          code: "INVALID_INPUT",
          status: 400,
          meta: {
            provider: "offline-heuristic",
            model: null,
            mode: "fallback",
            fallbackUsed: true,
            latencyMs: 0,
          },
        } satisfies AIErrorResponse,
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        {
          error: "Invalid JSON request payload",
          code: "INVALID_INPUT",
          status: 400,
          meta: {
            provider: "offline-heuristic",
            model: null,
            mode: "fallback",
            fallbackUsed: true,
            latencyMs: 0,
          },
        } satisfies AIErrorResponse,
        { status: 400 }
      );
    }

    if (!body.message || typeof body.message !== "string" || !body.message.trim()) {
      return NextResponse.json(
        {
          error: "Missing required field: message",
          code: "INVALID_INPUT",
          status: 400,
          meta: {
            provider: "offline-heuristic",
            model: null,
            mode: "fallback",
            fallbackUsed: true,
            latencyMs: 0,
          },
        } satisfies AIErrorResponse,
        { status: 400 }
      );
    }

    if (!body.leadContext || typeof body.leadContext !== "object") {
      return NextResponse.json(
        {
          error: "Missing required field: leadContext",
          code: "INVALID_INPUT",
          status: 400,
          meta: {
            provider: "offline-heuristic",
            model: null,
            mode: "fallback",
            fallbackUsed: true,
            latencyMs: 0,
          },
        } satisfies AIErrorResponse,
        { status: 400 }
      );
    }

    const rawLead = body.leadContext;
    const boundedContext = {
      id: typeof rawLead.id === "string" ? rawLead.id.slice(0, 50) : undefined,
      name: String(rawLead.name || "").slice(0, 100),
      location: String(rawLead.location || "").slice(0, 100),
      propertyRequirement: String(rawLead.propertyRequirement || "").slice(0, 150),
      budget: typeof rawLead.budget === "number" && !isNaN(rawLead.budget) ? Math.max(0, rawLead.budget) : 0,
      buyingTimeline: String(rawLead.buyingTimeline || "").slice(0, 50),
      customerMessage: String(rawLead.customerMessage || "").slice(0, 4000),
      priority: rawLead.priority && typeof rawLead.priority === "object"
        ? {
            total: typeof rawLead.priority.total === "number" ? rawLead.priority.total : 0,
            band: String(rawLead.priority.band || "cold").slice(0, 20),
          }
        : undefined,
      analysis: rawLead.analysis && typeof rawLead.analysis === "object"
        ? {
            summary: rawLead.analysis.summary ? String(rawLead.analysis.summary).slice(0, 1500) : undefined,
            intent: rawLead.analysis.intent ? String(rawLead.analysis.intent).slice(0, 50) : undefined,
            requirements: Array.isArray(rawLead.analysis.requirements)
              ? rawLead.analysis.requirements.slice(0, 10).map((r) => ({ label: String(r.label || "").slice(0, 100) }))
              : undefined,
            objections: Array.isArray(rawLead.analysis.objections)
              ? rawLead.analysis.objections.slice(0, 10).map((o) => ({
                  label: String(o.label || "").slice(0, 100),
                  severity: String(o.severity || "medium").slice(0, 20),
                  recommendedHandling: o.recommendedHandling ? String(o.recommendedHandling).slice(0, 300) : undefined,
                }))
              : undefined,
            recommendedAction: rawLead.analysis.recommendedAction && typeof rawLead.analysis.recommendedAction === "object"
              ? {
                  description: String(rawLead.analysis.recommendedAction.description || "").slice(0, 300),
                  timeframe: String(rawLead.analysis.recommendedAction.timeframe || "").slice(0, 100),
                }
              : undefined,
            suggestedResponse: rawLead.analysis.suggestedResponse ? String(rawLead.analysis.suggestedResponse).slice(0, 2000) : undefined,
            missingInformation: Array.isArray(rawLead.analysis.missingInformation)
              ? rawLead.analysis.missingInformation.slice(0, 10).map((m) => String(m).slice(0, 150))
              : undefined,
          }
        : null,
      analysisSummary: rawLead.analysisSummary ? String(rawLead.analysisSummary).slice(0, 2000) : null,
    };

    const boundedHistory = Array.isArray(body.history)
      ? body.history
          .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
          .slice(-6)
          .map((m) => ({ role: m.role, content: m.content.slice(0, 1500) }))
      : [];

    const response = await performCopilotChat(
      body.message.trim().slice(0, 2000),
      boundedContext,
      boundedHistory
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in /api/leads/chat:", error);
    const latencyMs = Math.round(performance.now() - start);
    return NextResponse.json(
      {
        error: "Failed to process chat with sales coach",
        code: "UNEXPECTED_SERVER_ERROR",
        status: 500,
        details: error instanceof Error ? error.message : String(error),
        meta: {
          provider: "offline-heuristic",
          model: null,
          mode: "fallback",
          fallbackUsed: true,
          latencyMs,
          message: error instanceof Error ? error.message : "Internal server error",
        },
      } satisfies AIErrorResponse,
      { status: 500 }
    );
  }
}
