"use client";

import { useState, useMemo } from "react";
import {
  Sparkles,
  ArrowLeft,
  RefreshCw,
  Clock,
  MapPin,
  Flame,
  Minus,
  Snowflake,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronDown,
  Compass,
  Share2,
  Check,
} from "lucide-react";
import type {
  Lead,
  LeadMomentumPlan,
  StepStatus,
  PlanningObjective,
  CommunicationFormat,
  MomentumPlanStep,
} from "@/types/lead";
import { formatINR, formatTimeline } from "@/lib/utils/format";
import { StepCard } from "./StepCard";
import { PlanObjectiveModal } from "./PlanObjectiveModal";

interface MomentumWorkspaceProps {
  leads: Lead[];
  selectedLeadId: string;
  onSelectLead: (id: string) => void;
  onBackToLead: () => void;
  plans: Record<string, LeadMomentumPlan>;
  onSavePlan: (plan: LeadMomentumPlan) => void;
  onStatusChange: (leadId: string, stepId: string, status: StepStatus, blockedReason?: string) => void;
  onOpenCoach?: (lead: Lead, step?: MomentumPlanStep) => void;
  onOpenRehearsal?: (lead: Lead, step?: MomentumPlanStep) => void;
}

const BAND_CONFIG = {
  hot: { label: "Hot", icon: Flame, class: "bg-hot-fill text-hot border border-hot/20" },
  warm: { label: "Warm", icon: Minus, class: "bg-warm-fill text-warm border border-warm/20" },
  cold: { label: "Cold", icon: Snowflake, class: "bg-cold-fill text-cold border border-cold/20" },
};

export function MomentumWorkspace({
  leads,
  selectedLeadId,
  onSelectLead,
  onBackToLead,
  plans,
  onSavePlan,
  onStatusChange,
  onOpenCoach,
  onOpenRehearsal,
}: MomentumWorkspaceProps) {
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isAdaptationMode, setIsAdaptationMode] = useState(false);
  const [isRegenConfirmOpen, setIsRegenConfirmOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const selectedLead = useMemo(
    () => leads.find((l) => l.id === selectedLeadId) || leads[0] || null,
    [leads, selectedLeadId]
  );

  const activePlan = useMemo(
    () => (selectedLead ? plans[selectedLead.id] || null : null),
    [plans, selectedLead]
  );

  // Derived progress statistics
  const progressStats = useMemo(() => {
    if (!activePlan || !activePlan.steps.length) {
      return { total: 0, completed: 0, skipped: 0, inProgress: 0, blocked: 0, percent: 0 };
    }
    const total = activePlan.steps.length;
    const completed = activePlan.steps.filter((s) => s.status === "completed").length;
    const skipped = activePlan.steps.filter((s) => s.status === "skipped").length;
    const inProgress = activePlan.steps.filter((s) => s.status === "in_progress").length;
    const blocked = activePlan.steps.filter((s) => s.status === "blocked").length;
    const percent = Math.round(((completed + skipped) / total) * 100);

    return { total, completed, skipped, inProgress, blocked, percent };
  }, [activePlan]);

  const handleGenerateOrAdapt = async (params: {
    objective: PlanningObjective;
    communicationFormat: CommunicationFormat;
    additionalInstructions?: string;
    isAdaptation?: boolean;
    adaptationReason?: string;
  }) => {
    if (!selectedLead) return;

    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const payload = {
        lead: {
          id: selectedLead.id,
          name: selectedLead.name,
          location: selectedLead.location,
          propertyRequirement: selectedLead.propertyRequirement,
          budget: selectedLead.budget,
          buyingTimeline: selectedLead.buyingTimeline,
          customerMessage: selectedLead.customerMessage,
          priority: {
            total: selectedLead.priority.total,
            band: selectedLead.priority.band,
          },
          analysis: selectedLead.analysis
            ? {
                summary: selectedLead.analysis.summary,
                intent: selectedLead.analysis.intent,
                requirements: selectedLead.analysis.requirements,
                objections: selectedLead.analysis.objections,
              }
            : null,
        },
        objective: params.objective,
        communicationFormat: params.communicationFormat,
        additionalInstructions: params.additionalInstructions,
        isAdaptation: params.isAdaptation,
        previousPlan:
          params.isAdaptation && activePlan
            ? {
                planId: activePlan.planId,
                planVersion: activePlan.planVersion,
                completedSteps: activePlan.steps.filter((s) => s.status === "completed"),
                remainingSteps: activePlan.steps.filter((s) => s.status !== "completed"),
                adaptationReason: params.adaptationReason,
              }
            : undefined,
      };

      const res = await fetch("/api/leads/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const generatedPlan: LeadMomentumPlan = await res.json();
      onSavePlan(generatedPlan);
      setIsConfigModalOpen(false);
    } catch (err) {
      console.error("Failed to generate momentum plan:", err);
      setErrorMsg(err instanceof Error ? err.message : "Failed to generate momentum plan");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopySummary = () => {
    if (!activePlan) return;
    const text = `SIGNALDESK MOMENTUM PLAN: ${activePlan.planTitle}
Customer: ${selectedLead?.name} (${selectedLead?.location})
Objective: ${activePlan.objectiveLabel}
Progress: ${progressStats.completed}/${progressStats.total} steps completed (${progressStats.percent}%)
Strategy: ${activePlan.strategyRationale}

STEPS:
${activePlan.steps.map((s) => `${s.sequence}. [${s.status.toUpperCase()}] ${s.title}: ${s.purpose}`).join("\n")}`;

    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  if (!selectedLead) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center bg-canvas">
        <p className="text-sm text-muted">No leads available in workspace.</p>
      </div>
    );
  }

  const band = BAND_CONFIG[selectedLead.priority.band] || BAND_CONFIG.warm;
  const BandIcon = band.icon;

  return (
    <div className="h-full flex flex-col bg-canvas overflow-y-auto">
      {/* ── Top Workbench Bar ── */}
      <header className="shrink-0 px-4 sm:px-6 py-4 border-b border-edge bg-panel sticky top-0 z-30 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Back & Lead Switcher */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onBackToLead}
              className="w-8 h-8 flex items-center justify-center rounded-md text-muted hover:text-ink hover:bg-raised transition-colors shrink-0"
              title="Return to lead details"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-accent shrink-0">
                <Compass className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold text-ink truncate">Lead Momentum Plan</h1>
                  {activePlan && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-raised text-muted border border-edge">
                      v{activePlan.planVersion}
                    </span>
                  )}
                </div>
                {/* Lead selector */}
                <div className="flex items-center gap-1.5 text-xs text-muted mt-0.5">
                  <span>For:</span>
                  <div className="relative inline-block">
                    <select
                      value={selectedLead.id}
                      onChange={(e) => onSelectLead(e.target.value)}
                      className="font-semibold text-ink bg-transparent pr-5 appearance-none cursor-pointer hover:underline focus:outline-hidden"
                    >
                      {leads.map((l) => (
                        <option key={l.id} value={l.id} className="bg-panel text-ink">
                          {l.name} ({formatINR(l.budget)})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3 h-3 absolute right-0 top-1 pointer-events-none text-muted" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 shrink-0">
            {activePlan ? (
              <>
                <button
                  onClick={handleCopySummary}
                  className="px-3 py-1.5 text-xs font-medium text-muted hover:text-ink hover:bg-raised border border-edge rounded-md transition-colors flex items-center gap-1.5"
                  title="Copy formatted plan summary to clipboard"
                >
                  {copiedSummary ? <Check className="w-3.5 h-3.5 text-positive" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{copiedSummary ? "Copied" : "Share"}</span>
                </button>

                <button
                  onClick={() => {
                    setIsAdaptationMode(true);
                    setIsConfigModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-accent text-accent-fg rounded-md hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Adapt Remaining</span>
                </button>

                <button
                  onClick={() => setIsRegenConfirmOpen(true)}
                  className="px-3 py-1.5 text-xs font-medium text-muted hover:text-danger hover:bg-raised border border-edge rounded-md transition-colors"
                  title="Rebuild plan from scratch"
                >
                  Regenerate
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setIsAdaptationMode(false);
                  setIsConfigModalOpen(true);
                }}
                className="px-4 py-1.5 text-xs font-semibold bg-brand text-accent rounded-md hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Plan</span>
              </button>
            )}
          </div>
        </div>

        {/* Lead Context Bar */}
        <div className="mt-3 pt-3 border-t border-divider flex flex-wrap items-center justify-between gap-y-2 text-xs text-muted">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="flex items-center gap-1 font-medium text-ink">
              <MapPin className="w-3 h-3 text-subtle" />
              {selectedLead.location}
            </span>
            <span>{selectedLead.propertyRequirement}</span>
            <span className="font-semibold text-ink">
              {selectedLead.budget > 0 ? formatINR(selectedLead.budget) : "Budget undisclosed"}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-subtle" />
              {formatTimeline(selectedLead.buyingTimeline)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${band.class}`}>
              <BandIcon className="w-3 h-3" />
              <span>{selectedLead.priority.total} {band.label.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content Area ── */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Error Alert if any */}
        {errorMsg && (
          <div className="p-4 rounded-xl border border-danger/30 bg-danger/5 flex items-start gap-3 text-xs text-danger anim-fade-in">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Generation Notice</p>
              <p className="mt-0.5 text-muted">{errorMsg}</p>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-subtle hover:text-ink font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ── Empty State if no plan ── */}
        {!activePlan ? (
          <div className="p-12 text-center rounded-2xl border-2 border-dashed border-edge bg-panel flex flex-col items-center justify-center anim-fade-up">
            <div className="w-12 h-12 rounded-xl bg-brand flex items-center justify-center text-accent mb-4 shadow-sm">
              <Compass className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-ink mb-1">
              No Momentum Plan Generated Yet
            </h2>
            <p className="text-xs text-muted max-w-md leading-relaxed mb-6">
              Go beyond summaries. Generate an actionable, dynamic roadmap with personalized conversation scripts, contingency branches, and progress tracking for {selectedLead.name}.
            </p>
            <button
              onClick={() => {
                setIsAdaptationMode(false);
                setIsConfigModalOpen(true);
              }}
              className="px-5 py-2.5 rounded-lg text-xs font-semibold bg-brand text-accent hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Momentum Plan</span>
            </button>
          </div>
        ) : (
          <>
            {/* ── Telemetry & Ground Truth Banner ── */}
            {activePlan.meta?.mode === "live" ? (
              <div className="flex items-center justify-between px-3.5 py-2 text-xs bg-accent-subtle text-accent rounded-lg border border-accent/25 anim-fade-in">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 shrink-0 text-accent" />
                  <span className="font-semibold">
                    Live Gemini Strategy ({activePlan.meta.model || "gemini-3.8-flash"})
                  </span>
                </div>
                <span className="font-mono text-[11px] text-subtle">{activePlan.meta.latencyMs}ms latency</span>
              </div>
            ) : activePlan.meta?.mode === "fallback" ? (
              <div className="flex items-center justify-between px-3.5 py-2 text-xs bg-warm-fill text-warm rounded-lg border border-warm/25 anim-fade-in">
                <div className="flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  <span>Offline Heuristic Engine — Server API Key not configured</span>
                </div>
                <span className="font-mono text-[11px] text-subtle">{activePlan.meta.latencyMs}ms</span>
              </div>
            ) : activePlan.meta?.mode === "fixture" ? (
              <div className="flex items-center gap-2 px-3.5 py-2 text-xs bg-raised text-muted rounded-lg border border-edge">
                <Info className="w-3.5 h-3.5 shrink-0 text-subtle" />
                <span>Canonical Seed Demonstration Plan — pre-calculated verified fixture.</span>
              </div>
            ) : null}

            {/* ── Strategy Overview Card ── */}
            <div className="p-5 sm:p-6 rounded-2xl bg-panel border border-edge shadow-xs space-y-4 anim-fade-up">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-accent font-semibold block mb-0.5">
                    Plan Objective: {activePlan.objectiveLabel}
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-ink">
                    {activePlan.planTitle}
                  </h2>
                </div>

                {/* Progress bar pill */}
                <div className="sm:text-right shrink-0">
                  <div className="text-xs font-semibold text-ink mb-1 flex items-center sm:justify-end gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-positive" />
                    <span>
                      {progressStats.completed} of {progressStats.total} steps done ({progressStats.percent}%)
                    </span>
                  </div>
                  <div className="w-48 sm:w-56 h-2 bg-raised rounded-full overflow-hidden border border-edge">
                    <div
                      className="h-full bg-brand transition-all duration-500 rounded-full"
                      style={{ width: `${progressStats.percent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Situation Summary & Strategy Rationale */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-3.5 bg-canvas/70 rounded-xl border border-divider">
                  <span className="text-[10px] font-semibold text-subtle uppercase tracking-wider block mb-1">
                    Current Lead Situation
                  </span>
                  <p className="text-xs text-ink leading-relaxed">
                    {activePlan.leadSituationSummary}
                  </p>
                </div>

                <div className="p-3.5 bg-canvas/70 rounded-xl border border-divider">
                  <span className="text-[10px] font-semibold text-subtle uppercase tracking-wider block mb-1">
                    Strategic Rationale
                  </span>
                  <p className="text-xs text-ink leading-relaxed">
                    {activePlan.strategyRationale}
                  </p>
                </div>
              </div>

              {/* Assumptions, Unknowns, and Success Definition */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                <div className="p-3 rounded-lg bg-raised/30 border border-edge">
                  <span className="text-[10px] font-semibold text-subtle uppercase tracking-wider block mb-1">
                    Key Assumptions
                  </span>
                  <ul className="space-y-1 text-muted text-[11px]">
                    {activePlan.assumptions.map((a, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-subtle">•</span>
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 rounded-lg bg-raised/30 border border-edge">
                  <span className="text-[10px] font-semibold text-subtle uppercase tracking-wider block mb-1">
                    Unknowns to Verify
                  </span>
                  <ul className="space-y-1 text-muted text-[11px]">
                    {activePlan.unknowns.map((u, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-caution">•</span>
                        <span>{u}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 rounded-lg bg-raised/30 border border-edge">
                  <span className="text-[10px] font-semibold text-subtle uppercase tracking-wider block mb-1">
                    Definition of Success
                  </span>
                  <p className="text-muted text-[11px] leading-relaxed">
                    {activePlan.successDefinition}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Dynamic Timeline of Action Steps ── */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-semibold text-subtle uppercase tracking-wider">
                  Adaptive Action Sequence ({activePlan.steps.length} Steps)
                </h3>
                <span className="text-[11px] text-muted">
                  Click any step to inspect rationale, copy drafts, and view contingencies.
                </span>
              </div>

              {/* Vertical connector timeline */}
              <div className="relative space-y-3.5 before:absolute before:left-7 sm:before:left-8 before:top-4 before:bottom-4 before:w-0.5 before:bg-divider/70 before:-z-0">
                {activePlan.steps.map((step, idx) => (
                  <div key={step.id} className="relative z-10">
                    <StepCard
                      step={step}
                      totalSteps={activePlan.steps.length}
                      onStatusChange={(stepId, status, blockedReason) =>
                        onStatusChange(selectedLead.id, stepId, status, blockedReason)
                      }
                      onOpenCoach={onOpenCoach ? (st) => onOpenCoach(selectedLead, st) : undefined}
                      onOpenRehearsal={
                        onOpenRehearsal ? (st) => onOpenRehearsal(selectedLead, st) : undefined
                      }
                      defaultExpanded={idx === 0 || step.status === "in_progress"}
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>

      {/* ── Modal: Objective & Plan Generation ── */}
      <PlanObjectiveModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        lead={selectedLead}
        onSubmit={handleGenerateOrAdapt}
        isGenerating={isGenerating}
        existingPlan={activePlan}
        isAdaptationMode={isAdaptationMode}
      />

      {/* ── Modal: Regeneration Confirmation ── */}
      {isRegenConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs anim-fade-in">
          <div className="w-full max-w-md bg-panel border border-edge rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-caution">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold text-ink">Regenerate Entire Plan?</h3>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Regenerating will replace this plan and reset any completed step history or notes.
            </p>
            <p className="text-xs text-ink font-medium">
              Tip: To preserve your completed steps and adapt only remaining actions, click &ldquo;Adapt Remaining&rdquo; instead.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-edge">
              <button
                onClick={() => setIsRegenConfirmOpen(false)}
                className="px-3 py-1.5 text-xs text-muted hover:text-ink font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsRegenConfirmOpen(false);
                  setIsAdaptationMode(false);
                  setIsConfigModalOpen(true);
                }}
                className="px-4 py-1.5 text-xs font-semibold bg-danger text-white rounded-md hover:opacity-90"
              >
                Proceed to Regenerate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
