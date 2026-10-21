"use client";

import { useState } from "react";
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
  AlertTriangle,
  Info,
  Phone,
  Mail,
  MessageSquare,
  Flame,
  Minus,
  Snowflake,
  Loader2,
  Trash2,
  Compass,
} from "lucide-react";
import type { Lead, SuggestedAction, TimelineTouchpoint, LeadMomentumPlan, ExtractedObjection } from "@/types/lead";
import { formatINR, formatTimeline } from "@/lib/utils/format";

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


// ---------------------------------------------------------------------------
// Band config
// ---------------------------------------------------------------------------
const BAND = {
  hot: { label: "Hot", icon: Flame, class: "bg-hot-fill text-hot border border-hot/20", ring: "ring-hot/20" },
  warm: { label: "Warm", icon: Minus, class: "bg-warm-fill text-warm border border-warm/20", ring: "ring-warm/20" },
  cold: { label: "Cold", icon: Snowflake, class: "bg-cold-fill text-cold border border-cold/20", ring: "ring-cold/20" },
};

const CHANNEL_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  call: Phone,
  whatsapp: MessageSquare,
  email: Mail,
  site_visit: MapPin,
  follow_up: Clock,
  share_info: Info,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
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
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const band = BAND[lead.priority.band];
  const BandIcon = band.icon;
  const analysis = lead.analysis;

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  };

  return (
    <div className="h-full flex flex-col">
      {/* ── Header ── */}
      <header className="shrink-0 px-6 py-4 border-b border-edge bg-panel">
        {/* Back (mobile) + Actions */}
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={onBack}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-md text-muted hover:text-ink hover:bg-raised"
            aria-label="Back to lead list"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex-1" />

          {/* Action bar */}
          {onOpenMomentumPlan && (
            <button
              onClick={onOpenMomentumPlan}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                existingPlan
                  ? "bg-brand text-accent border border-accent/30 shadow-2xs"
                  : "text-muted hover:text-ink hover:bg-raised border border-edge"
              }`}
              title="View or generate Lead Momentum Plan"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>{existingPlan ? "Momentum Plan" : "Generate Plan"}</span>
            </button>
          )}

          <button
            onClick={onOpenCopilot}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors
              ${isCopilotActive
                ? "bg-brand text-white"
                : "text-muted hover:text-ink hover:bg-raised border border-edge"}`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AI Coach</span>
          </button>

          <button
            onClick={() => onOpenRehearsal()}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors
              ${isRehearsalActive
                ? "bg-brand text-accent font-semibold shadow-xs"
                : "text-muted hover:text-ink hover:bg-raised border border-edge"}`}
            title="Practise this conversation with AI buyer simulation"
          >
            <Target className="w-3.5 h-3.5 text-brand" />
            <span className="hidden sm:inline">Practise this conversation</span>
            <span className="sm:hidden">Practise</span>
          </button>

          <button
            onClick={() => onReanalyze(lead.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted hover:text-ink hover:bg-raised border border-edge rounded-md transition-colors"
            title="Re-analyse with AI"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Analyse</span>
          </button>


          <button
            onClick={() => {
              if (confirmDelete) { onDelete(lead.id); setConfirmDelete(false); }
              else setConfirmDelete(true);
            }}
            onBlur={() => setConfirmDelete(false)}
            className={`flex items-center gap-1 px-2 py-1.5 text-xs rounded-md transition-colors
              ${confirmDelete ? "bg-danger text-white" : "text-subtle hover:text-danger hover:bg-raised"}`}
            title={confirmDelete ? "Click again to confirm" : "Delete lead"}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Lead identity */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-ink truncate">{lead.name}</h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {lead.location}
              </span>
              <span>{lead.propertyRequirement}</span>
              <span className="font-medium">{formatINR(lead.budget)}</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> {formatTimeline(lead.buyingTimeline)}
              </span>
            </div>
          </div>

          {/* Score badge */}
          <div className="shrink-0 text-center">
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-bold ${band.class}`}>
              <BandIcon className="w-3.5 h-3.5" />
              {lead.priority.total}
            </div>
            <button
              onClick={() => setShowScoreBreakdown(!showScoreBreakdown)}
              className="block mx-auto mt-1 text-[10px] text-subtle hover:text-muted transition-colors"
            >
              {showScoreBreakdown ? "Hide" : "Why this score?"}
            </button>
          </div>
        </div>

        {/* Score breakdown */}
        {showScoreBreakdown && (
          <div className="mt-3 p-3 bg-canvas rounded-md border border-divider anim-fade-up">
            <p className="text-[10px] font-medium text-subtle uppercase tracking-wider mb-2">
              Score Breakdown
            </p>
            <div className="space-y-1.5">
              {lead.priority.factors.map((f) => (
                <div key={f.name} className="flex items-center gap-2 text-xs">
                  <div className="w-24 text-muted truncate">{f.label}</div>
                  <div className="flex-1 h-1.5 bg-raised rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand rounded-full transition-all duration-slow"
                      style={{ width: `${(f.points / f.maxPoints) * 100}%` }}
                    />
                  </div>
                  <div className="w-10 text-right font-mono text-subtle">
                    {f.points}/{f.maxPoints}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-subtle">
              {lead.priority.factors.map((f) => f.reason).join(". ")}.
            </p>
          </div>
        )}
      </header>

      {/* ── Analysis Content ── */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {/* Analysis status indicator */}
        {analysis?.meta?.mode === "live" ? (
          <div className="flex items-center justify-between px-3 py-2 mb-4 text-xs bg-accent-subtle text-accent rounded-md border border-accent/20 anim-fade-in">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 shrink-0 text-accent" />
              <span className="font-medium">Live Gemini Analysis ({analysis.meta.model || "gemini-3.8-flash"})</span>
            </div>
            <span className="font-mono text-[11px] text-subtle">{analysis.meta.latencyMs}ms latency</span>
          </div>
        ) : analysis?.meta?.mode === "fallback" ? (
          <div className="flex items-center justify-between px-3 py-2 mb-4 text-xs bg-warm-fill text-warm rounded-md border border-warm/20 anim-fade-in">
            <div className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>Offline Heuristic Assistance — Server GEMINI_API_KEY unconfigured</span>
            </div>
            <span className="font-mono text-[11px] text-subtle">{analysis.meta.latencyMs}ms</span>
          </div>
        ) : analysis?.isSeeded ? (
          <div className="flex items-center gap-2 px-3 py-2 mb-4 text-xs bg-raised text-muted rounded-md border border-edge">
            <Info className="w-3.5 h-3.5 shrink-0 text-subtle" />
            <span>Example analysis — pre-generated fixture preview, not from a live API call.</span>
          </div>
        ) : null}

        {lead.analysisStatus === "pending" && !analysis && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Sparkles className="w-8 h-8 text-subtle mb-3" />
            <p className="text-sm font-medium text-muted mb-1">Awaiting AI analysis</p>
            <p className="text-xs text-subtle mb-4 max-w-xs">
              Click &ldquo;Analyse&rdquo; to run the AI assessment when the integration is connected.
            </p>
            <button
              onClick={() => onReanalyze(lead.id)}
              className="px-4 py-2 text-xs font-medium bg-accent text-accent-fg rounded-md hover:opacity-90 transition-opacity"
            >
              Run Analysis
            </button>
          </div>
        )}

        {lead.analysisStatus === "analyzing" && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="w-6 h-6 text-brand animate-spin mb-3" />
            <p className="text-sm font-medium text-muted">Analysing lead…</p>
            <p className="text-xs text-subtle mt-1">AI is reviewing the customer message.</p>
          </div>
        )}

        {lead.analysisStatus === "error" && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertTriangle className="w-8 h-8 text-danger mb-3" />
            <p className="text-sm font-medium text-muted mb-1">Analysis failed</p>
            <p className="text-xs text-subtle mb-4">Something went wrong. You can retry the analysis.</p>
            <button
              onClick={() => onReanalyze(lead.id)}
              className="px-4 py-2 text-xs font-medium bg-accent text-accent-fg rounded-md hover:opacity-90 transition-opacity"
            >
              Retry Analysis
            </button>
          </div>
        )}

        {analysis && (
          <div className="space-y-5 anim-fade-up">
            {/* ── Recommended Action (strongest visual) ── */}
            <ActionCard action={analysis.recommendedAction} />

            {/* ── Lead Momentum Plan Banner ── */}
            <div className="p-4 rounded-xl border border-accent/30 bg-accent/[0.04] shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-accent shrink-0 mt-0.5">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
                        Lead Momentum Plan
                      </h4>
                      {existingPlan && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-raised text-muted border border-edge">
                          v{existingPlan.planVersion} • {existingPlan.steps.length} steps
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted mt-0.5 leading-snug">
                      {existingPlan
                        ? `${existingPlan.planTitle} (${existingPlan.steps.filter((s) => s.status === "completed").length} of ${existingPlan.steps.length} steps completed)`
                        : "Turn customer requirements and objections into an adaptive, multi-step action sequence with ready-to-copy scripts."}
                    </p>
                  </div>
                </div>

                {onOpenMomentumPlan && (
                  <button
                    onClick={onOpenMomentumPlan}
                    className="px-4 py-2 text-xs font-semibold bg-brand text-accent rounded-lg hover:opacity-90 transition-opacity shrink-0 flex items-center gap-1.5 shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{existingPlan ? "View Momentum Plan" : "Generate Momentum Plan"}</span>
                  </button>
                )}
              </div>
            </div>

            {/* ── Summary ── */}
            <Section title="Summary">
              <p className="text-sm text-ink leading-relaxed">{analysis.summary}</p>
            </Section>

            {/* ── Customer Intent ── */}
            <Section title="Customer Intent">
              <div className="flex items-center gap-2">
                <IntentBadge intent={analysis.intent} />
                <span className="text-xs text-subtle">
                  {Math.round(analysis.intentConfidence * 100)}% confidence
                </span>
              </div>
            </Section>

            {/* ── Key Requirements ── */}
            {analysis.requirements.length > 0 && (
              <Section title="Key Requirements">
                <ul className="space-y-1">
                  {analysis.requirements.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-brand shrink-0" />
                      <span className="text-ink">{r.label}</span>
                      {r.confidence === "inferred" && (
                        <span className="text-[10px] text-subtle italic shrink-0">inferred</span>
                      )}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* ── Objections & Concerns ── */}
            {analysis.objections.length > 0 && (
              <Section title="Objections & Concerns">
                <ul className="space-y-2">
                  {analysis.objections.map((o, i) => (
                    <li key={i} className="p-2.5 rounded-lg border border-edge bg-canvas/60 text-xs">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-semibold text-ink flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            o.severity === "high" ? "bg-danger" : o.severity === "medium" ? "bg-caution" : "bg-subtle"
                          }`} />
                          {o.label}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-mono ${
                          o.severity === "high" ? "bg-danger/10 text-danger" : o.severity === "medium" ? "bg-caution/10 text-caution" : "bg-raised text-subtle"
                        }`}>
                          {o.severity}
                        </span>
                      </div>
                      {o.recommendedHandling && (
                        <p className="text-[11px] text-muted leading-relaxed mt-1">
                          <strong className="text-ink font-medium">Handling:</strong> {o.recommendedHandling}
                        </p>
                      )}
                      {o.evidenceQuote && (
                        <p className="text-[10px] text-subtle italic mt-0.5">
                          &ldquo;{o.evidenceQuote}&rdquo;
                        </p>
                      )}

                      <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-edge/40">
                        <span className="text-[10px] text-subtle">
                          {o.recommendedHandling ? "Strategy available" : "Documented hesitation"}
                        </span>
                        <button
                          onClick={() => onOpenRehearsal(o)}
                          className="px-2 py-0.5 rounded text-[10px] font-semibold text-brand hover:bg-brand/10 transition-colors flex items-center gap-1"
                          title={`Practise handling: ${o.label}`}
                        >
                          <Target className="w-3 h-3" />
                          <span>Practise this objection</span>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* ── Customer Evidence Quotes ── */}
            {analysis.evidence && analysis.evidence.length > 0 && (
              <Section title="Customer Evidence Quotes">
                <div className="space-y-1.5">
                  {analysis.evidence.map((ev, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded bg-raised/40 border border-edge text-xs">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0 ${
                        ev.verified ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                      }`}>
                        {ev.verified ? "Verified Quote" : "Unverified"}
                      </span>
                      <p className="text-muted italic text-[11px] leading-relaxed">&ldquo;{ev.quote}&rdquo;</p>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* ── Missing Information & Uncertainties ── */}
            {((analysis.missingInformation && analysis.missingInformation.length > 0) || (analysis.uncertainties && analysis.uncertainties.length > 0)) && (
              <Section title="Missing Facts & Uncertainties">
                <div className="space-y-2.5 p-3 rounded-lg border border-edge bg-canvas/40">
                  {analysis.missingInformation && analysis.missingInformation.length > 0 && (
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-subtle block mb-1">Unresolved Information</span>
                      <ul className="space-y-1">
                        {analysis.missingInformation.map((m, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-muted">
                            <span className="text-amber-500 font-bold">•</span>
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {analysis.uncertainties && analysis.uncertainties.length > 0 && (
                    <div className="pt-2 border-t border-edge">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-subtle block mb-1">Analysis Uncertainties</span>
                      <ul className="space-y-1">
                        {analysis.uncertainties.map((u, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-subtle">
                            <span className="text-subtle">•</span>
                            <span>{u}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* ── Suggested Response ── */}
            <Section
              title="Suggested Response"
              action={
                <button
                  onClick={() => handleCopy(analysis.suggestedResponse)}
                  className="flex items-center gap-1 text-[10px] text-muted hover:text-ink transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-positive" /> : <Copy className="w-3 h-3" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              }
            >
              <div className="p-3 bg-canvas rounded-md border border-divider text-sm text-ink leading-relaxed whitespace-pre-wrap">
                {analysis.suggestedResponse}
              </div>
            </Section>

            {/* ── Deal Velocity Timeline ── */}
            {analysis.timeline.length > 0 && (
              <Section title="Deal Velocity Timeline">
                <Timeline touchpoints={analysis.timeline} />
              </Section>
            )}

            {/* ── Customer Message (source evidence) ── */}
            <Section title="Customer Message (Source)">
              <div className="p-3 bg-canvas rounded-md border border-divider text-sm text-muted leading-relaxed whitespace-pre-wrap">
                {lead.customerMessage}
              </div>
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Recommended Action Card
// ---------------------------------------------------------------------------
function ActionCard({ action }: { action: SuggestedAction }) {
  const ChannelIcon = CHANNEL_ICON[action.type] || Phone;

  return (
    <div className="p-4 rounded-lg border-2 border-accent/40 bg-accent/5">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center">
          <ChannelIcon className="w-3.5 h-3.5 text-accent-fg" />
        </div>
        <div>
          <p className="text-xs font-semibold text-ink uppercase tracking-wider">
            Next Action
          </p>
          <p className="text-[10px] text-muted">{action.timeframe}</p>
        </div>
      </div>
      <p className="text-sm text-ink leading-relaxed">{action.description}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------
function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-subtle uppercase tracking-wider">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Intent Badge
// ---------------------------------------------------------------------------
function IntentBadge({ intent }: { intent: string }) {
  const labels: Record<string, string> = {
    ready_to_buy: "Ready to Buy",
    actively_searching: "Actively Searching",
    comparing_options: "Comparing Options",
    early_research: "Early Research",
    seeking_information: "Seeking Information",
    callback_request: "Callback Request",
    unclear: "Unclear",
  };

  const colors: Record<string, string> = {
    ready_to_buy: "bg-hot-fill text-hot",
    actively_searching: "bg-warm-fill text-warm",
    comparing_options: "bg-warm-fill text-warm",
    early_research: "bg-cold-fill text-cold",
    seeking_information: "bg-cold-fill text-cold",
    callback_request: "bg-warm-fill text-warm",
    unclear: "bg-cold-fill text-cold",
  };

  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${colors[intent] || "bg-raised text-muted"}`}>
      {labels[intent] || intent}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------
function Timeline({ touchpoints }: { touchpoints: TimelineTouchpoint[] }) {
  return (
    <div className="relative pl-4">
      {/* Vertical line */}
      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-edge" />

      <div className="space-y-3">
        {touchpoints.map((tp, i) => {
          const ChannelIcon = CHANNEL_ICON[tp.channel] || Clock;
          return (
            <div key={i} className="relative flex items-start gap-3">
              {/* Dot */}
              <div className={`absolute left-[-12px] mt-1.5 w-2.5 h-2.5 rounded-full border-2 border-panel
                ${tp.completed ? "bg-positive" : i === 0 ? "bg-accent" : "bg-edge"}`}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <ChannelIcon className="w-3 h-3 text-subtle shrink-0" />
                  <span className="text-sm text-ink">{tp.action}</span>
                </div>
                <span className="text-[10px] text-subtle">
                  {tp.dayOffset === 0 ? "Today" : `Day ${tp.dayOffset}`}
                </span>
              </div>
            </div>
          );
        })}
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
    <div className="h-full flex flex-col items-center justify-center px-6 text-center anim-fade-in">
      <h2 className="text-xl font-semibold text-ink mb-1">Your next best conversation</h2>
      <p className="text-sm text-muted mb-6 max-w-sm">
        Select a lead from the queue to see AI-powered analysis, scoring rationale, and recommended actions.
      </p>

      {/* Compact stats strip */}
      <div className="flex gap-4 mb-6">
        {stats.hot > 0 && (
          <div className="text-center">
            <div className="text-lg font-bold text-hot">{stats.hot}</div>
            <div className="text-[10px] text-subtle uppercase tracking-wider">High Priority</div>
          </div>
        )}
        {stats.pending > 0 && (
          <div className="text-center">
            <div className="text-lg font-bold text-caution">{stats.pending}</div>
            <div className="text-[10px] text-subtle uppercase tracking-wider">Awaiting Analysis</div>
          </div>
        )}
        <div className="text-center">
          <div className="text-lg font-bold text-ink">{stats.total}</div>
          <div className="text-[10px] text-subtle uppercase tracking-wider">Total Leads</div>
        </div>
      </div>

      <button
        onClick={onNewLead}
        className="px-4 py-2 text-sm font-medium bg-accent text-accent-fg rounded-md hover:opacity-90 transition-opacity"
      >
        + Add New Lead
      </button>
    </div>
  );
}
