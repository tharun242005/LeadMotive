"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, Check, AlertCircle, Loader2, ShieldCheck, Cpu } from "lucide-react";
import type { DiagnosticsResponse } from "@/types/ai";

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AISettingsModal({ isOpen, onClose }: AISettingsModalProps) {
  const [loading, setLoading] = useState(false);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsResponse | null>(null);

  const fetchDiagnostics = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/leads/diagnostics");
      const data: DiagnosticsResponse = await res.json();
      setDiagnostics(data);
    } catch {
      setDiagnostics({
        configured: false,
        model: "gemini-3.8-flash",
        tested: true,
        status: "error",
        message: "Failed to query server diagnostics endpoint.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDiagnostics();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isLiveReady = diagnostics?.configured && diagnostics.status === "ready";

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
              <p className="text-[11px] text-subtle">Server-side Google Gemini 3.8 Flash Status</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md text-subtle hover:text-ink hover:bg-raised transition-colors"
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
              <span className="font-medium text-ink">Server AI Readiness:</span>
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${
                  isLiveReady
                    ? "bg-accent-subtle text-accent"
                    : "bg-warm-fill text-warm border border-warm/20"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isLiveReady ? "bg-accent animate-pulse" : "bg-warm"
                  }`}
                />
                {isLiveReady
                  ? "Live Gemini Connected"
                  : diagnostics?.configured
                  ? "Configured (Awaiting Verification)"
                  : "Offline Heuristic Mode"}
              </span>
            </div>
            <p className="text-[11px] text-muted leading-relaxed">
              {diagnostics?.configured
                ? "The server environment has GEMINI_API_KEY set. Requests execute against the configured model with sub-second latency."
                : "Live GEMINI_API_KEY is not configured in the server environment. SignalDesk runs its deterministic Bengaluru heuristic engine so you can test all workflows without external dependencies."}
            </p>
          </div>

          {/* Diagnostic metrics */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-md border border-edge bg-raised/30">
              <span className="text-[10px] text-subtle block uppercase tracking-wider mb-1">
                Target Model
              </span>
              <span className="text-xs font-mono font-medium text-ink">
                {diagnostics?.model || "gemini-3.8-flash"}
              </span>
            </div>

            <div className="p-3 rounded-md border border-edge bg-raised/30">
              <span className="text-[10px] text-subtle block uppercase tracking-wider mb-1">
                Security Sandbox
              </span>
              <span className="text-xs font-medium text-ink inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                Zero Browser Keys
              </span>
            </div>
          </div>

          {/* Diagnostic details if tested */}
          {diagnostics && (
            <div
              className={`p-3 rounded-md border text-xs flex items-start gap-2.5 ${
                diagnostics.status === "ready"
                  ? "bg-accent-subtle/40 border-accent/30 text-ink"
                  : diagnostics.status === "unconfigured"
                  ? "bg-warm-fill/60 border-warm/20 text-muted"
                  : "bg-danger-fill border-danger/30 text-danger"
              }`}
            >
              {diagnostics.status === "ready" ? (
                <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              ) : diagnostics.status === "unconfigured" ? (
                <Sparkles className="w-4 h-4 text-warm shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <p className="font-medium text-ink">
                  {diagnostics.status === "ready"
                    ? "Connectivity Verified"
                    : diagnostics.status === "unconfigured"
                    ? "Heuristic Preview Active"
                    : "Provider Error"}
                </p>
                <p className="text-[11px] text-muted">{diagnostics.message}</p>
                {diagnostics.latencyMs !== undefined && (
                  <p className="text-[10px] text-subtle font-mono">
                    Round-trip latency: {diagnostics.latencyMs}ms
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Environment guide */}
          <div className="p-3 rounded-md border border-edge bg-panel text-[11px] text-subtle space-y-1">
            <p className="font-medium text-ink">Server Configuration Instructions</p>
            <p>
              To enable live Gemini calls in development or on Vercel, set the environment variable:
            </p>
            <code className="block bg-raised px-2 py-1 rounded font-mono text-[10px] text-ink">
              GEMINI_API_KEY=AIzaSy...
            </code>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-between border-t border-edge">
            <button
              type="button"
              onClick={fetchDiagnostics}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-medium border border-edge rounded-md text-ink hover:bg-raised transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-accent" />
              )}
              <span>{loading ? "Testing..." : "Test Connection"}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium bg-raised text-ink hover:bg-edge rounded-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
