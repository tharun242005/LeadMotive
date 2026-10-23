import { NextRequest, NextResponse } from "next/server";
import { checkServerDiagnostics, DEFAULT_GEMINI_MODEL } from "@/lib/ai/client";
import { getCanonicalAIConfig } from "@/lib/ai/provider";

export async function GET(req: NextRequest) {
  try {
    const isExplicitTest =
      req.nextUrl.searchParams.get("test") === "true" ||
      req.nextUrl.searchParams.get("test") === "1";

    const diagnostics = await checkServerDiagnostics({
      forceLiveTest: isExplicitTest,
    });
    return NextResponse.json(diagnostics);
  } catch (err) {
    const config = getCanonicalAIConfig();
    return NextResponse.json(
      {
        configured: config.isAnyConfigured,
        model: config.geminiModel || DEFAULT_GEMINI_MODEL,
        tested: true,
        status: "error",
        statusLabel: "Provider Error",
        activeProvider: "offline-heuristic",
        primaryConfigured: config.isGeminiConfigured,
        secondaryConfigured: config.isGroqConfigured,
        message: err instanceof Error ? err.message : "Diagnostic check failed",
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const diagnostics = await checkServerDiagnostics({ forceLiveTest: true });
    return NextResponse.json(diagnostics);
  } catch (err) {
    const config = getCanonicalAIConfig();
    return NextResponse.json(
      {
        configured: config.isAnyConfigured,
        model: config.geminiModel || DEFAULT_GEMINI_MODEL,
        tested: true,
        status: "error",
        statusLabel: "Provider Error",
        activeProvider: "offline-heuristic",
        primaryConfigured: config.isGeminiConfigured,
        secondaryConfigured: config.isGroqConfigured,
        message: err instanceof Error ? err.message : "Live diagnostic check failed",
      },
      { status: 500 }
    );
  }
}
