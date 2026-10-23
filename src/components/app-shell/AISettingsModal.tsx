"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, Check, AlertCircle, Loader2, ShieldCheck, Cpu, RefreshCw, Zap } from "lucide-react";
import type { DiagnosticsResponse } from "@/types/ai";

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AISettingsModal({ isOpen, onClose }: AISettingsModalProps) {
  const [loading, setLoading] = useState(false);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsResponse | null>(null);

  // Passive status read (cached server state, zero token consumption)
  const fetchPassiveDiagnostics = async () => {
    try {
      const res = await fetch("/api/leads/diagnostics");
      const data: DiagnosticsResponse = await res.json();
      setDiagnostics(data);
    } catch {
      setDiagnostics({
        configured: false,
        model: "gemini-3.5-flash-lite",
        tested: false,
        status: "error",
        statusLabel: "Connection Error",
        activeProvider: "offline-heuristic",
        message: "Failed to query server diagnostics endpoint.",
      });
    }
  };

  // Explicit active test (live provider round-trip)
  const runActiveTest = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/leads/diagnostics?test=true");
      const data: DiagnosticsResponse = await res.json();
      setDiagnostics(data);
    } catch {
      setDiagnostics({
        configured: false,
        model: "gemini-3.5-flash-lite",
        tested: true,
        status: "error",
        statusLabel: "Connection Error",
        activeProvider: "offline-heuristic",
        message: "Live connection test failed to reach server endpoint.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPassiveDiagnostics();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Compute status presentation
  const status = diagnostics?.status || "unconfigured";
  const statusLabel =
    diagnostics?.statusLabel ||
    (status === "ready"
      ? "Gemini Ready"
      : status === "secondary_active"
      ? "Secondary AI Active"
      : status === "rate_limited"
      ? "Gemini Rate Limited"
      : status === "unavailable"
      ? "Gemini Unavailable"
      : status === "unconfigured"
      ? "Configuration Required"
      : "Offline Heuristic Mode");

  const isGreen = status === "ready";
  const isBlue = status === "secondary_active";
  const isAmber = status === "rate_limited" || status === "unavailable";
  const isRed = status === "error";

  const badgeStyle = isGreen
    ? "bg-accent-subtle text-accent border-accent/30"
    : isBlue
    ? "bg-brand/10 text-brand border-brand/30"
    : isAmber
    ? "bg-warm-fill text-warm border-warm/30"
    : isRed
    ? "bg-danger-fill text-danger border-danger/30"
    : "bg-raised text-muted border-edge";

  const dotStyle = isGreen
    ? "bg-accent animate-pulse"
    : isBlue
    ? "bg-brand animate-pulse"
    : isAmber
    ? "bg-warm"
    : isRed
    ? "bg-danger"
    : "bg-subtle";

  const activeProviderDisplay =
    diagnostics?.activeProvider === "google-gemini"
      ? "Google Gemini"
      : diagnostics?.activeProvider === "groq"
      ? "Groq (Secondary Fallback)"
      : "Bengaluru Heuristic Engine";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4 anim-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-xs" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-panel border border-edge rounded-xl shadow-xl overflow-hidden anim-scale">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-edge">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-accent-subtle flex items-center justify-center text-accent">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-ink">AI Engine & Server Diagnostics</h2>
              <p className="text-[11px] text-subtle">Provider Cascade: Gemini → Groq → Offline Heuristics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md text-subtle hover:text-ink hover:bg-raised transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Status summary banner */}
          <div className="p-3.5 rounded-lg border border-edge bg-canvas/60">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-ink">Operational Status:</span>
              <span
                id="ai-readiness-badge"
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${badgeStyle}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${dotStyle}`} />
                {statusLabel}
              </span>
            </div>
            <p className="text-[11px] text-muted leading-relaxed">
              {diagnostics?.message ||
                "LeadMotive utilizes a resilient dual-provider architecture with instant offline heuristic fallback to ensure 100% workflow availability."}
            </p>
          </div>

          {/* Diagnostic metrics */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-md border border-edge bg-raised/30">
              <span className="text-[10px] text-subtle block uppercase tracking-wider mb-1">
                Configured Primary Model
              </span>
              <span className="text-xs font-mono font-medium text-ink">
                {diagnostics?.primaryModel || diagnostics?.model || "gemini-3.5-flash-lite"}
              </span>
            </div>

            <div className="p-3 rounded-md border border-edge bg-raised/30">
              <span className="text-[10px] text-subtle block uppercase tracking-wider mb-1">
                Active Provider
              </span>
              <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                {diagnostics?.activeProvider === "google-gemini" ? (
                  <Sparkles className="w-3.5 h-3.5 text-accent shrink-0" />
                ) : diagnostics?.activeProvider === "groq" ? (
                  <Zap className="w-3.5 h-3.5 text-brand shrink-0" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-subtle shrink-0" />
                )}
                <span className="truncate">{activeProviderDisplay}</span>
              </span>
            </div>
          </div>

          {/* Diagnostic details if tested */}
          {diagnostics && (
            <div
              className={`p-3 rounded-md border text-xs flex items-start gap-2.5 ${
                isGreen
                  ? "bg-accent-subtle/40 border-accent/30 text-ink"
                  : isBlue
                  ? "bg-brand/10 border-brand/30 text-ink"
                  : isAmber
                  ? "bg-warm-fill/60 border-warm/20 text-muted"
                  : "bg-danger-fill border-danger/30 text-danger"
              }`}
            >
              {isGreen ? (
                <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              ) : isBlue ? (
                <Zap className="w-4 h-4 text-brand shrink-0 mt-0.5" />
              ) : isAmber ? (
                <AlertCircle className="w-4 h-4 text-warm shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-ink">
                    {diagnostics.tested ? "Live Connection Verified" : "Cached Server State"}
                  </p>
                  {diagnostics.latencyMs !== undefined && (
                    <span className="text-[11px] font-mono text-muted">
                      {diagnostics.latencyMs}ms round-trip
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted">{diagnostics.message}</p>
                {diagnostics.lastTestedAt && (
                  <p className="text-[10px] text-subtle font-mono pt-0.5">
                    Checked: {new Date(diagnostics.lastTestedAt).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Environment configuration instructions (ZERO SECRETS EXPOSED) */}
          <div className="p-3.5 rounded-md border border-edge bg-panel text-[11px] text-subtle space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-ink">Server Configuration Guidance</p>
              <span className="inline-flex items-center gap-1 text-[10px] text-accent">
                <ShieldCheck className="w-3.5 h-3.5" /> Zero Browser Keys
              </span>
            </div>
            <p className="text-muted leading-relaxed">
              Configure environment variables on your server or Vercel deployment. Never enter API keys into browser inputs or commit them to Git.
            </p>
            <div className="bg-raised p-2 rounded-md font-mono text-[10px] text-ink space-y-1 border border-edge/60">
              <div className="text-subtle"># Primary Provider</div>
              <div>GEMINI_API_KEY=&lt;your_key&gt;</div>
              <div>GEMINI_MODEL=gemini-3.5-flash-lite</div>
              <div className="text-subtle pt-1"># Optional Secondary Provider</div>
              <div>GROQ_API_KEY=&lt;optional_key&gt;</div>
              <div>GROQ_MODEL=openai/gpt-oss-20b</div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-between border-t border-edge">
            <button
              id="test-connection-btn"
              type="button"
              onClick={runActiveTest}
              disabled={loading}
              className="px-3.5 py-1.5 text-xs font-semibold border border-edge rounded-md text-ink hover:bg-raised transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-brand" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5 text-brand" />
              )}
              <span>{loading ? "Testing Connection…" : "Test Connection"}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold bg-raised text-ink hover:bg-edge rounded-md transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
