import { NextRequest, NextResponse } from "next/server";
import { performLeadAnalysis } from "@/lib/ai/client";
import type { AnalyzeLeadRequest, AIErrorCode } from "@/types/ai";

export async function POST(req: NextRequest) {
  try {
    let body: AnalyzeLeadRequest;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          error: "Invalid JSON request payload.",
          code: "INVALID_INPUT" as AIErrorCode,
          status: 400,
        },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        {
          error: "Invalid JSON request payload.",
          code: "INVALID_INPUT" as AIErrorCode,
          status: 400,
        },
        { status: 400 }
      );
    }

    if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json(
        {
          error: "Missing required field: name",
          code: "INVALID_INPUT" as AIErrorCode,
          status: 400,
        },
        { status: 400 }
      );
    }

    if (body.name.trim().length > 100) {
      return NextResponse.json(
        {
          error: "Customer name exceeds maximum allowed length of 100 characters.",
          code: "INVALID_INPUT" as AIErrorCode,
          status: 400,
        },
        { status: 400 }
      );
    }

    if (!body.customerMessage || typeof body.customerMessage !== "string" || !body.customerMessage.trim()) {
      return NextResponse.json(
        {
          error: "Missing required field: customerMessage",
          code: "INVALID_INPUT" as AIErrorCode,
          status: 400,
        },
        { status: 400 }
      );
    }

    if (body.customerMessage.trim().length > 4000) {
      return NextResponse.json(
        {
          error: "Customer message exceeds maximum allowed length of 4000 characters.",
          code: "INVALID_INPUT" as AIErrorCode,
          status: 400,
        },
        { status: 400 }
      );
    }

    if (body.location && typeof body.location === "string" && body.location.trim().length > 150) {
      return NextResponse.json(
        {
          error: "Location field exceeds maximum allowed length of 150 characters.",
          code: "INVALID_INPUT" as AIErrorCode,
          status: 400,
        },
        { status: 400 }
      );
    }

    if (body.propertyRequirement && typeof body.propertyRequirement === "string" && body.propertyRequirement.trim().length > 250) {
      return NextResponse.json(
        {
          error: "Property requirement field exceeds maximum allowed length of 250 characters.",
          code: "INVALID_INPUT" as AIErrorCode,
          status: 400,
        },
        { status: 400 }
      );
    }

    const boundedLead: AnalyzeLeadRequest = {
      name: body.name.trim(),
      location: (body.location || "").trim(),
      propertyRequirement: (body.propertyRequirement || "").trim(),
      budget: typeof body.budget === "number" && !isNaN(body.budget) ? Math.max(0, body.budget) : 0,
      buyingTimeline: (body.buyingTimeline || "not_specified").trim(),
      customerMessage: body.customerMessage.trim(),
    };

    const response = await performLeadAnalysis(boundedLead);
    return NextResponse.json(response);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Error in /api/leads/analyze:", msg);

    let code: AIErrorCode = "UNEXPECTED_SERVER_ERROR";
    let status = 500;

    if (msg.includes("GEMINI_API_KEY is not configured")) {
      code = "MISSING_API_CONFIGURATION";
      status = 503;
    } else if (msg.includes("429") || msg.toLowerCase().includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) {
      code = "PROVIDER_QUOTA_EXCEEDED";
      status = 429;
    } else if (msg.toLowerCase().includes("network") || msg.toLowerCase().includes("timeout") || msg.toLowerCase().includes("fetch failed")) {
      code = "PROVIDER_NETWORK_FAILURE";
      status = 502;
    } else if (msg.toLowerCase().includes("json") || msg.toLowerCase().includes("schema") || msg.toLowerCase().includes("malformed")) {
      code = "MALFORMED_MODEL_OUTPUT";
      status = 502;
    }

    return NextResponse.json(
      {
        error: "Failed to analyze lead",
        code,
        status,
        details: msg,
      },
      { status }
    );
  }
}
