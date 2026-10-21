import { NextResponse } from "next/server";
import { checkServerDiagnostics } from "@/lib/ai/client";

export async function GET() {
  try {
    const diagnostics = await checkServerDiagnostics();
    return NextResponse.json(diagnostics);
  } catch (err) {
    return NextResponse.json(
      {
        configured: false,
        model: "gemini-3.8-flash",
        tested: true,
        status: "error",
        message: err instanceof Error ? err.message : "Diagnostic check failed",
      },
      { status: 500 }
    );
  }
}
