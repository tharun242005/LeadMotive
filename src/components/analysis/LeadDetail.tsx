"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  RefreshCw,
  Sparkles,
  MessageCircle,
  Target,
  Copy,
  Check,
  MapPin,
  Clock,
  Info,
  Flame,
  Minus,
  Snowflake,
  Loader2,
  Trash2,
  Compass,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  AlertCircle,
  Zap,
} from "lucide-react";
import type { Lead, LeadMomentumPlan, ExtractedObjection } from "@/types/lead";
import { formatINR, formatTimeline } from "@/lib/utils/format";
import { PRIORITY_BAND_LABELS, PRIORITY_STYLES } from "@/lib/leads/scoring";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface LeadDetailProps {
  lead: Lead;
  onReanalyze: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenCopilot: () => void;
  onOpenRehearsal: (targetObjection?: ExtractedObjection) => void;
  onOpenMomentumPlan?: () => void;
  existingPlan?: LeadMomentumPlan | null;
  onBack: () => void;
  isCopilotActive: boolean;
  isRehearsalActive: boolean;
}

const BAND = {
  hot: { label: PRIORITY_BAND_LABELS.hot, icon: Flame, class: PRIORITY_STYLES.hot.badgeClass, dot: PRIORITY_STYLES.hot.dotClass },
  warm: { label: PRIORITY_BAND_LABELS.warm, icon: Minus, class: PRIORITY_STYLES.warm.badgeClass, dot: PRIORITY_STYLES.warm.dotClass },
  cold: { label: PRIORITY_BAND_LABELS.cold, icon: Snowflake, class: PRIORITY_STYLES.cold.badgeClass, dot: PRIORITY_STYLES.cold.dotClass },
};

type TabKey = "overview" | "requirements" | "objections" | "suggested_response";

export function LeadDetail({
  lead,
  onReanalyze,
  onDelete,
  onOpenCopilot,
  onOpenRehearsal,
  onOpenMomentumPlan,
  existingPlan,
  onBack,
  isCopilotActive,
  isRehearsalActive,
}: LeadDetailProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setActiveTab("overview");
  }, [lead.id]);

  const band = BAND[lead.priority.band];
  const BandIcon = band.icon;
  const analysis = lead.analysis;

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  return (
    <div className="h-full flex flex-col bg-canvas text-ink select-text">
      {/* ── Top Header Bar ── */}
      <header className="shrink-0 px-6 py-4 border-b border-edge bg-panel transition-colors">
        {/* Navigation & Action Controls Row */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-ink hover:bg-raised cursor-pointer"
              aria-label="Back to lead list"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-subtle">
              <span>LEAD ID:</span>
              <span className="font-semibold text-ink">{lead.id}</span>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex items-center gap-2">
            {onOpenMomentumPlan && (
              <button
                id="generate-plan-btn"
                onClick={onOpenMomentumPlan}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-xs ${
                  existingPlan
                    ? "bg-brand text-brand-fg hover:opacity-90"
                    : "text-muted hover:text-ink hover:bg-raised border border-edge"
                }`}
                title="View or generate Lead Momentum Plan"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>{existingPlan ? "Momentum Plan" : "Generate Plan"}</span>
              </button>
            )}

            <button
              id="ai-coach-btn"
              onClick={onOpenCopilot}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-xs ${
                isCopilotActive
                  ? "bg-brand text-brand-fg"
                  : "text-muted hover:text-ink hover:bg-raised border border-edge"
              }`}
              title="Open AI Sales Coach in split-screen drawer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>AI Coach</span>
            </button>

            <button
              id="practise-btn"
              onClick={() => onOpenRehearsal()}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-xs ${
                isRehearsalActive
                  ? "bg-brand text-brand-fg"
                  : "text-muted hover:text-ink hover:bg-raised border border-edge"
              }`}
              title="Practise this conversation with AI buyer simulation"
            >
              <Target className="w-3.5 h-3.5" />
              <span>Practise</span>
            </button>

            <button
              id="analyse-btn"
              onClick={() => onReanalyze(lead.id)}
              disabled={lead.analysisStatus === "analyzing"}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-edge rounded-lg transition-colors cursor-pointer ${
                lead.analysisStatus === "analyzing"
                  ? "bg-brand/10 text-brand cursor-wait"
                  : "text-muted hover:text-ink hover:bg-raised"
              }`}
              title="Re-analyse lead with Gemini AI"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${lead.analysisStatus === "analyzing" ? "animate-spin text-brand" : ""}`} />
              <span className="hidden lg:inline">
                {lead.analysisStatus === "analyzing" ? "Analyzing…" : "Analyse"}
              </span>
            </button>

            <button
              id="delete-lead-btn"
              onClick={() => {
                if (confirmDelete) {
                  onDelete(lead.id);
                  setConfirmDelete(false);
                } else setConfirmDelete(true);
              }}
              onBlur={() => setConfirmDelete(false)}
              className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors cursor-pointer ${
                confirmDelete
                  ? "bg-danger text-white shadow-xs"
                  : "text-subtle hover:text-danger hover:bg-raised border border-edge/60"
              }`}
              title={confirmDelete ? "Click again to confirm delete" : "Delete lead"}
              aria-label={confirmDelete ? "Confirm delete lead" : "Delete lead"}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Lead Identity & Score Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-ink tracking-tight">{lead.name}</h1>
              {/* Score Badge */}
              <div
                title={`${band.label} (${lead.priority.total}/100)`}
                aria-label={`Priority band: ${band.label}, score: ${lead.priority.total} of 100`}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${band.class}`}
              >
                <BandIcon className="w-3.5 h-3.5" />
                <span>{band.label}</span>
                <span className="opacity-40">·</span>
                <span>{lead.priority.total}</span>
              </div>
            </div>

            {/* Sub-meta details row with icons */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-xs text-muted font-medium">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-subtle" />
                <span>{lead.location}</span>
              </span>
              <span>{lead.propertyRequirement}</span>
              <span className="font-bold text-ink font-mono">{formatINR(lead.budget)}</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-subtle" />
                <span>{formatTimeline(lead.buyingTimeline)}</span>
              </span>
            </div>
          </div>

          {/* Score Explanation toggle */}
          <div className="shrink-0 flex items-center gap-2">
            <button
              onClick={() => setShowScoreBreakdown(!showScoreBreakdown)}
              className="text-xs font-semibold text-brand hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>{showScoreBreakdown ? "Hide scoring factors" : "Why this score?"}</span>
            </button>
          </div>
        </div>

        {/* Score Breakdown Modal Tray */}
        {showScoreBreakdown && (
          <div className="mt-4 p-4 bg-raised/70 rounded-xl border border-edge anim-fade-up">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-ink uppercase tracking-wider">
                Deterministic 4-Factor Scoring Breakdown ({lead.priority.total}/100)
              </p>
              <span className="text-[11px] text-subtle italic">Rule-based qualification heuristic</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {lead.priority.factors.map((f) => (
                <div key={f.name} className="p-3 bg-panel rounded-lg border border-edge/60">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-muted truncate">{f.label}</span>
                    <span className="font-mono font-bold text-ink">{f.points}/{f.maxPoints}</span>
                  </div>
                  <div className="h-1.5 bg-raised rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-brand rounded-full transition-all duration-slow"
                      style={{ width: `${(f.points / f.maxPoints) * 100}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-subtle line-clamp-2">{f.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tabs Row ── */}
        <div
          role="tablist"
          aria-label="Lead analysis sections"
          className="flex items-center gap-1 border-t border-edge/60 mt-4 pt-2 -mb-2 overflow-x-auto no-scrollbar"
        >
          {(
            [
              { key: "overview", label: "Overview" },
              { key: "requirements", label: `Requirements (${analysis?.requirements.length || 0})` },
              { key: "objections", label: `Objections (${analysis?.objections.length || 0})` },
              { key: "suggested_response", label: "Suggested Response" },
            ] as const
          ).map((t) => {
            const isActive = activeTab === t.key;
            return (
              <button
                key={t.key}
                id={`tab-${t.key}`}
                role="tab"
                tabIndex={isActive ? 0 : -1}
                aria-selected={isActive}
                aria-controls={`panel-${t.key}`}
                onClick={() => setActiveTab(t.key)}
                className={`px-3.5 py-2 text-xs font-semibold tracking-wide transition-all border-b-2 cursor-pointer whitespace-nowrap
                  ${isActive
                    ? "border-brand text-brand"
                    : "border-transparent text-muted hover:text-ink hover:border-edge"
                  }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* ── Main Analysis Content Scroll Area ── */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Telemetry and Provenance banner */}
        {lead.analysisStatus === "error" ? (
          <div className="flex items-center justify-between px-3.5 py-2.5 text-xs bg-danger-fill text-danger rounded-xl border border-danger/30 shadow-xs anim-fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-semibold">Analysis failed · Retry</span>
              <span className="text-muted text-[11px]">Provider call could not complete</span>
            </div>
            <button
              onClick={() => onReanalyze(lead.id)}
              className="px-3 py-1 bg-danger text-white rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        ) : analysis?.meta?.mode === "live" && analysis.meta.provider === "groq" ? (
          <div className="flex items-center justify-between px-3.5 py-2 text-xs bg-brand/10 text-ink rounded-xl border border-brand/20 shadow-xs anim-fade-in">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-brand shrink-0" />
              <span className="font-semibold">Live AI · Groq fallback</span>
              <span className="text-muted">
                Model: <code className="font-mono font-bold text-ink">{analysis.meta.model || "openai/gpt-oss-20b"}</code>
                {analysis.meta.primaryFailureReason ? ` (${analysis.meta.primaryFailureReason})` : ""}
              </span>
            </div>
            <span className="font-mono text-[11px] text-muted">{analysis.meta.latencyMs}ms response</span>
          </div>
        ) : analysis?.meta?.mode === "live" ? (
          <div className="flex items-center justify-between px-3.5 py-2 text-xs bg-accent-subtle/50 text-ink rounded-xl border border-accent/30 shadow-xs anim-fade-in">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent shrink-0" />
              <span className="font-semibold">Live AI · Gemini</span>
              <span className="text-muted">
                Model: <code className="font-mono font-bold text-ink">{analysis.meta.model || "gemini-3.5-flash-lite"}</code>
              </span>
            </div>
            <span className="font-mono text-[11px] text-muted">{analysis.meta.latencyMs}ms response</span>
          </div>
        ) : analysis?.meta?.mode === "fallback" || analysis?.meta?.provider === "offline-heuristic" ? (
          <div className="flex items-center justify-between px-3.5 py-2 text-xs bg-warm-fill text-warm rounded-xl border border-warm/20 anim-fade-in">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span className="font-semibold">Offline heuristic</span>
              <span className="text-[11px] text-muted">Deterministic Bengaluru analysis active</span>
            </div>
            <span className="font-mono text-[11px]">{analysis.meta.latencyMs}ms</span>
          </div>
        ) : analysis?.isSeeded ? (
          <div className="flex items-center justify-between px-3.5 py-2 text-xs bg-raised text-muted rounded-xl border border-edge anim-fade-in">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0 text-subtle" />
              <span>Sample Demo Analysis · Synthetic benchmark data. Click <strong>Analyse</strong> above for live AI processing.</span>
            </div>
            <span className="text-[11px] font-mono text-subtle">Curated Fixture</span>
          </div>
        ) : null}

        {lead.analysisStatus === "pending" && !analysis && (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-panel border border-edge rounded-2xl p-8">
            <div className="w-12 h-12 rounded-2xl bg-brand/15 text-brand flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-ink mb-1">Awaiting AI Assessment</h3>
            <p className="text-xs text-muted max-w-sm mb-5 leading-relaxed">
              Run Gemini AI analysis to extract customer intent, detect budget/commute objections, and construct an actionable next step.
            </p>
            <button
              onClick={() => onReanalyze(lead.id)}
              className="px-5 py-2.5 text-xs font-semibold bg-brand text-brand-fg rounded-xl hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
            >
              Analyze Lead Now
            </button>
          </div>
        )}

        {lead.analysisStatus === "analyzing" && (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-panel border border-edge rounded-2xl p-8">
            <Loader2 className="w-8 h-8 text-brand animate-spin mb-3" />
            <h3 className="text-sm font-bold text-ink">Analyzing Inquiry…</h3>
            <p className="text-xs text-muted mt-1">Evaluating intent confidence, extraction metrics, and deal velocity.</p>
          </div>
        )}

        {lead.analysisStatus === "error" && !analysis && (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-panel border border-danger/30 rounded-2xl p-8">
            <div className="w-12 h-12 rounded-2xl bg-danger/15 text-danger flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-ink mb-1">Analysis Failed</h3>
            <p className="text-xs text-muted max-w-sm mb-5 leading-relaxed">
              Unable to complete AI analysis at this time. Please check connectivity or model configuration and retry.
            </p>
            <button
              id="retry-analysis-btn"
              onClick={() => onReanalyze(lead.id)}
              className="px-5 py-2.5 text-xs font-semibold bg-brand text-brand-fg rounded-xl hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
            >
              Retry Analysis
            </button>
          </div>
        )}

        {analysis && (
          <div
            id={`panel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`tab-${activeTab}`}
            className="space-y-6"
          >
            {/* ── TAB 1: OVERVIEW ── */}
            {activeTab === "overview" && (
              <div className="space-y-6 anim-fade-in">
                {/* 1. Next Recommended Action Card */}
                <div className="p-5 rounded-2xl border-2 border-brand/40 bg-panel shadow-sm relative overflow-hidden group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-brand/15 text-brand flex items-center justify-center shrink-0 border border-brand/30">
                        <Target className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-brand uppercase tracking-wider">
                            Next Recommended Action
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-raised text-muted border border-edge">
                            {analysis.recommendedAction.timeframe}
                          </span>
                        </div>
                        <p className="text-base font-semibold text-ink leading-relaxed">
                          {analysis.recommendedAction.description}
                        </p>
                        {analysis.recommendedAction.rationale && (
                          <p className="text-xs text-muted mt-1.5 leading-relaxed">
                            {analysis.recommendedAction.rationale}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => onOpenRehearsal()}
                      className="shrink-0 w-8 h-8 rounded-lg bg-raised hover:bg-brand hover:text-brand-fg border border-edge flex items-center justify-center text-muted transition-colors cursor-pointer"
                      title="Practise this action"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 2. Lead Momentum Plan Banner */}
                <div className="p-4 rounded-xl border border-edge bg-panel shadow-xs hover:border-brand/30 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0 border border-accent/30 mt-0.5">
                        <Compass className="w-5 h-5 text-brand" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
                            Lead Momentum Plan
                          </h4>
                          {existingPlan && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-raised text-muted border border-edge">
                              v{existingPlan.planVersion} · {existingPlan.steps.length} steps
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted mt-0.5 leading-relaxed">
                          {existingPlan
                            ? `${existingPlan.planTitle} (${existingPlan.steps.filter((s) => s.status === "completed").length} of ${existingPlan.steps.length} steps completed)`
                            : "Turn extracted requirements into a trackable, milestone-driven follow-up plan."}
                        </p>
                      </div>
                    </div>

                    {onOpenMomentumPlan && (
                      <button
                        onClick={onOpenMomentumPlan}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-brand text-brand-fg rounded-lg hover:opacity-90 transition-opacity shrink-0 cursor-pointer shadow-xs self-start sm:self-auto"
                      >
                        <span>{existingPlan ? "View Plan" : "Generate Plan"}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 3. Two-Column Structured Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column: Summary & Unknowns */}
                  <div className="space-y-6">
                    {/* Summary Card */}
                    <div className="p-5 bg-panel border border-edge rounded-xl shadow-xs">
                      <h3 className="text-xs font-bold text-subtle uppercase tracking-wider mb-2.5">
                        Executive Summary
                      </h3>
                      <p className="text-sm text-ink leading-relaxed font-normal">
                        {analysis.summary}
                      </p>
                    </div>

                    {/* Questions to Verify & Unknowns */}
                    {((analysis.missingInformation?.length ?? 0) > 0 || (analysis.uncertainties?.length ?? 0) > 0) && (
                      <div className="p-5 bg-panel border border-edge rounded-xl shadow-xs">
                        <div className="flex items-center justify-between mb-2.5">
                          <div className="flex items-center gap-2">
                            <HelpCircle className="w-4 h-4 text-caution" />
                            <h3 className="text-xs font-bold text-subtle uppercase tracking-wider">
                              Questions to Verify & Unknowns
                            </h3>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-caution/10 text-caution border border-caution/20">
                            Requires Verification · Not Established Fact
                          </span>
                        </div>
                        <p className="text-xs text-muted mb-3 leading-relaxed">
                          The following property details and availability criteria are unverified assumptions that must be confirmed with the developer:
                        </p>
                        <ul className="space-y-2">
                          {analysis.missingInformation?.map((item, idx) => (
                            <li key={`mi-${idx}`} className="flex items-start gap-2 text-xs">
                              <AlertCircle className="w-3.5 h-3.5 text-caution shrink-0 mt-0.5" />
                              <span className="text-ink leading-relaxed">{item}</span>
                            </li>
                          ))}
                          {analysis.uncertainties?.map((item, idx) => (
                            <li key={`unc-${idx}`} className="flex items-start gap-2 text-xs">
                              <AlertCircle className="w-3.5 h-3.5 text-subtle shrink-0 mt-0.5" />
                              <span className="text-muted leading-relaxed">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Customer Intent & Velocity Touchpoints */}
                  <div className="space-y-6">
                    {/* Customer Intent Card */}
                    <div className="p-5 bg-panel border border-edge rounded-xl shadow-xs">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold text-subtle uppercase tracking-wider">
                          Customer Intent
                        </h3>
                        <span className="text-xs font-mono font-bold text-brand bg-brand/10 px-2 py-0.5 rounded-md">
                          {Math.round(analysis.intentConfidence * 100)}% Confidence
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand/10 text-brand border border-brand/20">
                          {analysis.intent.replace(/_/g, " ").toUpperCase()}
                        </span>
                        <span className="text-xs text-muted">
                          {analysis.customerIntent?.explanation || "High-intent buyer actively preparing to execute transaction."}
                        </span>
                      </div>
                    </div>

                    {/* Deal Velocity Timeline */}
                    {analysis.timeline.length > 0 && (
                      <div className="p-5 bg-panel border border-edge rounded-xl shadow-xs">
                        <h3 className="text-xs font-bold text-subtle uppercase tracking-wider mb-3">
                          Deal Velocity Touchpoints
                        </h3>
                        <div className="space-y-2.5">
                          {analysis.timeline.map((tp, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-canvas border border-edge/60">
                              <div className="flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-brand" />
                                <span className="font-medium text-ink">{tp.action}</span>
                              </div>
                              <span className="text-[11px] text-subtle font-mono">
                                {tp.dayOffset === 0 ? "Today" : `Day ${tp.dayOffset}`}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 2: REQUIREMENTS ── */}
            {activeTab === "requirements" && (
              <div className="space-y-6 anim-fade-in">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column: Requirements & Verification */}
                  <div className="space-y-6">
                    {/* Key Requirements */}
                    <div className="p-5 bg-panel border border-edge rounded-xl shadow-xs">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold text-subtle uppercase tracking-wider">
                          Key Requirements ({analysis.requirements.length})
                        </h3>
                        <span className="text-[11px] text-muted">Extracted from inquiry</span>
                      </div>
                      <ul className="space-y-2.5">
                        {analysis.requirements.map((r, i) => (
                          <li key={i} className="flex items-start justify-between gap-3 text-xs p-2.5 rounded-lg bg-canvas border border-edge/60">
                            <div className="flex items-start gap-2.5">
                              <CheckCircle2 className="w-4 h-4 text-positive shrink-0 mt-0.5" />
                              <span className="text-ink font-medium leading-relaxed">{r.label}</span>
                            </div>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded border shrink-0 ${
                                r.confidence === "explicit"
                                  ? "bg-positive/10 text-positive border-positive/20"
                                  : "bg-caution/10 text-caution border-caution/20 italic"
                              }`}
                            >
                              {r.confidence === "explicit" ? "Explicit" : "Inferred"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Questions to Verify & Unknowns */}
                    {((analysis.missingInformation?.length ?? 0) > 0 || (analysis.uncertainties?.length ?? 0) > 0) && (
                      <div className="p-5 bg-panel border border-edge rounded-xl shadow-xs">
                        <div className="flex items-center justify-between mb-2.5">
                          <div className="flex items-center gap-2">
                            <HelpCircle className="w-4 h-4 text-caution" />
                            <h3 className="text-xs font-bold text-subtle uppercase tracking-wider">
                              Unknowns & Discovery Points
                            </h3>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-caution/10 text-caution border border-caution/20">
                            Needs Confirmation
                          </span>
                        </div>
                        <ul className="space-y-2">
                          {analysis.missingInformation?.map((item, idx) => (
                            <li key={`req-mi-${idx}`} className="flex items-start gap-2 text-xs">
                              <AlertCircle className="w-3.5 h-3.5 text-caution shrink-0 mt-0.5" />
                              <span className="text-ink leading-relaxed">{item}</span>
                            </li>
                          ))}
                          {analysis.uncertainties?.map((item, idx) => (
                            <li key={`req-unc-${idx}`} className="flex items-start gap-2 text-xs">
                              <AlertCircle className="w-3.5 h-3.5 text-subtle shrink-0 mt-0.5" />
                              <span className="text-muted leading-relaxed">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Source Inquiry & Customer Quotes */}
                  <div className="space-y-6">
                    {/* Raw Customer Message (Source Evidence) */}
                    <div className="p-5 bg-panel border border-edge rounded-xl shadow-xs">
                      <h3 className="text-xs font-bold text-subtle uppercase tracking-wider mb-2.5">
                        Customer Message (Raw Inquiry)
                      </h3>
                      <blockquote className="p-3.5 rounded-lg bg-canvas border-l-3 border-brand text-xs text-muted leading-relaxed italic">
                        &ldquo;{lead.customerMessage}&rdquo;
                      </blockquote>
                    </div>

                    {/* Customer Evidence & Grounding Verification */}
                    {(analysis.evidence?.length ?? 0) > 0 && (
                      <div className="p-5 bg-panel border border-edge rounded-xl shadow-xs">
                        <div className="flex items-center justify-between mb-2.5">
                          <h3 className="text-xs font-bold text-subtle uppercase tracking-wider">
                            Customer Evidence Quotes
                          </h3>
                          <span className="text-[10px] text-subtle">
                            Verbatim vs Inferred
                          </span>
                        </div>
                        <div className="space-y-2">
                          {analysis.evidence?.map((ev, idx) => (
                            <div key={idx} className="p-2.5 rounded-lg bg-canvas border border-edge/60 text-xs">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="font-mono text-[10px] text-subtle uppercase">{ev.field}</span>
                                {ev.verified ? (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-positive/10 text-positive border border-positive/20 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Verified Customer Evidence</span>
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-danger/10 text-danger border border-danger/20">
                                    Unverified / Inferred · Not Customer Evidence
                                  </span>
                                )}
                              </div>
                              <p className="text-ink italic">&ldquo;{ev.quote}&rdquo;</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 3: OBJECTIONS ── */}
            {activeTab === "objections" && (
              <div className="space-y-6 anim-fade-in">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Documented Objections */}
                  <div className="space-y-6">
                    <div className="p-5 bg-panel border border-edge rounded-xl shadow-xs">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold text-subtle uppercase tracking-wider">
                          Documented Hesitations & Objections ({analysis.objections.length})
                        </h3>
                        <span className="text-[11px] text-muted">Identified risks</span>
                      </div>
                      {analysis.objections.length === 0 ? (
                        <p className="text-xs text-muted italic">
                          No explicit objections stated in customer message. Lead is ready for direct walkthrough scheduling.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {analysis.objections.map((o, idx) => (
                            <div key={idx} className="p-3.5 bg-canvas border border-edge rounded-lg space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-bold text-ink">{o.label}</span>
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                    o.severity === "high"
                                      ? "bg-danger/10 text-danger border border-danger/20"
                                      : "bg-caution/10 text-caution border border-caution/20"
                                  }`}
                                >
                                  {o.severity} severity
                                </span>
                              </div>
                              {o.recommendedHandling && (
                                <p className="text-[11px] text-muted leading-relaxed">
                                  <strong className="text-ink">Handling Strategy:</strong> {o.recommendedHandling}
                                </p>
                              )}
                              <button
                                onClick={() => onOpenRehearsal(o)}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline pt-1 cursor-pointer"
                              >
                                <Target className="w-3.5 h-3.5" />
                                <span>Practise overcoming this objection in rehearsal</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rehearsal Simulation CTA Card */}
                  <div className="space-y-6">
                    <div className="p-5 bg-panel border border-edge rounded-xl shadow-xs">
                      <div className="w-10 h-10 rounded-xl bg-brand/15 text-brand flex items-center justify-center mb-3 border border-brand/30">
                        <Target className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-bold text-ink mb-1">
                        Objection Rehearsal Simulation
                      </h3>
                      <p className="text-xs text-muted leading-relaxed mb-4">
                        Test your talk tracks with an interactive AI buyer roleplaying {lead.name}&apos;s specific concerns about pricing, commute, or school catchment.
                      </p>
                      <button
                        onClick={() => onOpenRehearsal()}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-brand text-brand-fg rounded-lg hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                      >
                        <Target className="w-3.5 h-3.5" />
                        <span>Launch Objection Rehearsal</span>
                      </button>
                    </div>

                    {/* Customer Message Reference */}
                    <div className="p-5 bg-panel border border-edge rounded-xl shadow-xs">
                      <h3 className="text-xs font-bold text-subtle uppercase tracking-wider mb-2.5">
                        Customer Context
                      </h3>
                      <blockquote className="p-3.5 rounded-lg bg-canvas border-l-3 border-brand text-xs text-muted leading-relaxed italic">
                        &ldquo;{lead.customerMessage}&rdquo;
                      </blockquote>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 4: SUGGESTED RESPONSE ── */}
            {activeTab === "suggested_response" && (
              <div className="space-y-6 anim-fade-in">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column: Script and Next Action */}
                  <div className="space-y-6">
                    {/* Suggested Response Script */}
                    <div className="p-5 bg-panel border border-edge rounded-xl shadow-xs">
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-bold text-subtle uppercase tracking-wider">
                            Suggested Response Script
                          </h3>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-raised text-muted border border-edge/60 font-mono">
                            Tailored Draft
                          </span>
                        </div>
                        <button
                          onClick={() => handleCopy(analysis.suggestedResponse)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md text-brand bg-brand/10 hover:bg-brand hover:text-brand-fg transition-colors cursor-pointer"
                        >
                          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copied ? "Copied" : "Copy Script"}</span>
                        </button>
                      </div>
                      <div className="p-3.5 rounded-lg bg-canvas border border-edge text-xs text-ink leading-relaxed font-mono whitespace-pre-wrap">
                        {analysis.suggestedResponse}
                      </div>
                    </div>

                    {/* Next Action Box */}
                    <div className="p-4 rounded-xl border border-edge bg-panel shadow-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <Target className="w-4 h-4 text-brand" />
                        <span className="text-xs font-bold text-ink">Action Plan Alignment</span>
                      </div>
                      <p className="text-xs text-muted leading-relaxed">
                        Send this response within {analysis.recommendedAction.timeframe}. Keep questions focused on verifying their specific schedule and preferred floor facing.
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Customer Inquiry & Executive Summary */}
                  <div className="space-y-6">
                    {/* Raw Customer Message */}
                    <div className="p-5 bg-panel border border-edge rounded-xl shadow-xs">
                      <h3 className="text-xs font-bold text-subtle uppercase tracking-wider mb-2.5">
                        Customer Message (Raw Inquiry)
                      </h3>
                      <blockquote className="p-3.5 rounded-lg bg-canvas border-l-3 border-brand text-xs text-muted leading-relaxed italic">
                        &ldquo;{lead.customerMessage}&rdquo;
                      </blockquote>
                    </div>

                    {/* Executive Summary */}
                    <div className="p-5 bg-panel border border-edge rounded-xl shadow-xs">
                      <h3 className="text-xs font-bold text-subtle uppercase tracking-wider mb-2.5">
                        Executive Summary
                      </h3>
                      <p className="text-sm text-ink leading-relaxed font-normal">
                        {analysis.summary}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty workspace (no lead selected)
// ---------------------------------------------------------------------------
export function EmptyWorkspace({
  stats,
  onNewLead,
}: {
  stats: { hot: number; pending: number; total: number };
  onNewLead: () => void;
}) {
  return (
    <div className="h-full flex flex-col items-center justify-center px-6 py-16 text-center anim-fade-in bg-canvas">
      <div className="w-16 h-16 rounded-3xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand mb-5 shadow-sm">
        <Compass className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold text-ink mb-2 tracking-tight">Select a Lead to Activate Workspace</h2>
      <p className="text-sm text-muted mb-8 max-w-md leading-relaxed">
        Choose a buyer from the left pipeline queue to review deterministic 4-factor scoring, extract requirements with AI, and launch Objection Rehearsal.
      </p>

      {/* Stats Counter Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8 w-full max-w-sm">
        <div className="p-3.5 rounded-xl bg-panel border border-edge shadow-xs text-center">
          <div className="text-xl font-bold text-hot">{stats.hot}</div>
          <div className="text-[10px] text-subtle uppercase font-semibold tracking-wider mt-0.5">Act Now</div>
        </div>
        <div className="p-3.5 rounded-xl bg-panel border border-edge shadow-xs text-center">
          <div className="text-xl font-bold text-caution">{stats.pending}</div>
          <div className="text-[10px] text-subtle uppercase font-semibold tracking-wider mt-0.5">Unanalyzed</div>
        </div>
        <div className="p-3.5 rounded-xl bg-panel border border-edge shadow-xs text-center">
          <div className="text-xl font-bold text-ink">{stats.total}</div>
          <div className="text-[10px] text-subtle uppercase font-semibold tracking-wider mt-0.5">Total Pipeline</div>
        </div>
      </div>

      <button
        onClick={onNewLead}
        className="px-5 py-2.5 text-xs font-semibold bg-brand text-brand-fg rounded-xl hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
      >
        + Add New Lead Inquiry
      </button>
    </div>
  );
}
