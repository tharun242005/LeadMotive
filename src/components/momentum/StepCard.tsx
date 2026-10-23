"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Clock,
  AlertTriangle,
  MessageCircle,
  Target,
  Phone,
  Mail,
  MessageSquare,
} from "lucide-react";
import type { MomentumPlanStep, StepStatus, StepCategory } from "@/types/lead";

interface StepCardProps {
  step: MomentumPlanStep;
  totalSteps: number;
  onStatusChange: (stepId: string, status: StepStatus, blockedReason?: string) => void;
  onOpenCoach?: (step: MomentumPlanStep) => void;
  onOpenRehearsal?: (step: MomentumPlanStep) => void;
  defaultExpanded?: boolean;
}

const CATEGORY_CONFIG: Record<
  StepCategory,
  { label: string; color: string; border: string }
> = {
  outreach: { label: "Outreach", color: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/40", border: "border-blue-200 dark:border-blue-900" },
  discovery: { label: "Discovery", color: "text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950/40", border: "border-purple-200 dark:border-purple-900" },
  objection_handling: { label: "Objection Handling", color: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/40", border: "border-amber-200 dark:border-amber-900" },
  site_visit_prep: { label: "Site Visit Prep", color: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40", border: "border-emerald-200 dark:border-emerald-900" },
  proposal: { label: "Proposal & Closing", color: "text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/40", border: "border-rose-200 dark:border-rose-900" },
  follow_up: { label: "Follow-Up", color: "text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/40", border: "border-indigo-200 dark:border-indigo-900" },
  internal_prep: { label: "Internal Prep", color: "text-slate-600 bg-slate-50 dark:text-slate-400 dark:bg-slate-900", border: "border-slate-200 dark:border-slate-800" },
};


const IMPACT_COLORS: Record<string, string> = {
  proceed: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900",
  pause: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900",
  adapt: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900",
  stop: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900",
};

export function StepCard({
  step,
  totalSteps,
  onStatusChange,
  onOpenCoach,
  onOpenRehearsal,
  defaultExpanded = false,
}: StepCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [copiedDraft, setCopiedDraft] = useState(false);
  const [showBlockedPrompt, setShowBlockedPrompt] = useState(false);
  const [blockedInput, setBlockedInput] = useState("");

  const cat = CATEGORY_CONFIG[step.category] || CATEGORY_CONFIG.outreach;
  const draft = step.communicationDraft;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2000);
  };

  const handleStatusSelect = (newStatus: StepStatus) => {
    if (newStatus === "blocked") {
      setShowBlockedPrompt(true);
    } else {
      setShowBlockedPrompt(false);
      onStatusChange(step.id, newStatus);
    }
  };

  const submitBlocked = () => {
    onStatusChange(step.id, "blocked", blockedInput.trim() || "Blocked by external dependency");
    setShowBlockedPrompt(false);
  };

  return (
    <div
      className={`rounded-xl border transition-all duration-200 bg-panel ${
        step.status === "completed"
          ? "border-emerald-300/40 dark:border-emerald-900/40 bg-emerald-500/[0.02]"
          : step.status === "blocked"
          ? "border-rose-300/50 dark:border-rose-900/50 bg-rose-500/[0.02]"
          : isExpanded
          ? "border-accent/40 shadow-sm"
          : "border-edge hover:border-muted/30"
      }`}
    >
      {/* ── Step Header ── */}
      <div className="p-4 sm:p-5 flex items-start gap-3 sm:gap-4">
        {/* Sequence circle */}
        <div
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 font-mono text-xs font-bold transition-colors mt-0.5 ${
            step.status === "completed"
              ? "bg-emerald-600 text-white"
              : step.status === "blocked"
              ? "bg-rose-600 text-white"
              : step.status === "in_progress"
              ? "bg-brand text-brand-fg ring-2 ring-accent"
              : step.status === "skipped"
              ? "bg-raised text-subtle"
              : "bg-raised text-ink"
          }`}
        >
          {step.status === "completed" ? (
            <Check className="w-4 h-4 stroke-[3]" />
          ) : (
            step.sequence
          )}
        </div>

        {/* Title, metadata and purpose */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${cat.color} ${cat.border}`}
            >
              {cat.label}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-muted font-mono">
              <Clock className="w-3 h-3 text-subtle" />
              {step.timing}
            </span>
            {step.status === "blocked" && step.blockedReason && (
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-danger/10 text-danger border border-danger/20">
                Blocked: {step.blockedReason}
              </span>
            )}
          </div>

          <h3
            onClick={() => setIsExpanded(!isExpanded)}
            className={`text-sm font-semibold text-ink hover:text-brand cursor-pointer transition-colors leading-snug ${
              step.status === "completed" ? "line-through opacity-75" : ""
            }`}
          >
            {step.title}
          </h3>

          <p className="text-xs text-muted mt-1 leading-relaxed line-clamp-2">
            {step.purpose}
          </p>
        </div>

        {/* Status Dropdown & Expand Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <select
              value={step.status}
              onChange={(e) => handleStatusSelect(e.target.value as StepStatus)}
              aria-label={`Status for step ${step.sequence}`}
              className={`text-xs font-semibold px-2.5 py-1.5 rounded-md border appearance-none pr-7 cursor-pointer transition-colors focus:outline-hidden focus:ring-1 focus:ring-accent ${
                step.status === "completed"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800"
                  : step.status === "in_progress"
                  ? "bg-brand text-brand-fg border-brand"
                  : step.status === "blocked"
                  ? "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800"
                  : step.status === "skipped"
                  ? "bg-raised text-subtle border-edge"
                  : "bg-canvas text-ink border-edge hover:border-muted"
              }`}
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="skipped">Skipped</option>
              <option value="blocked">Blocked</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-2.5 pointer-events-none text-muted" />
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-8 h-8 flex items-center justify-center rounded-md text-muted hover:text-ink hover:bg-raised transition-colors"
            title={isExpanded ? "Collapse step details" : "Expand step details"}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Blocked reason input inline modal */}
      {showBlockedPrompt && (
        <div className="mx-4 sm:mx-5 mb-4 p-3 bg-danger/5 border border-danger/20 rounded-lg anim-fade-in">
          <p className="text-xs font-semibold text-danger mb-1.5">
            Specify Blocked Reason
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={blockedInput}
              onChange={(e) => setBlockedInput(e.target.value)}
              placeholder="e.g. Waiting on bank CIBIL report, or customer out of station..."
              className="flex-1 px-3 py-1.5 text-xs bg-canvas text-ink border border-edge rounded-md focus:outline-hidden focus:ring-1 focus:ring-danger"
              autoFocus
            />
            <button
              onClick={submitBlocked}
              className="px-3 py-1.5 text-xs font-semibold bg-danger text-white rounded-md hover:opacity-90"
            >
              Save
            </button>
            <button
              onClick={() => setShowBlockedPrompt(false)}
              className="px-2 py-1.5 text-xs text-muted hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Expanded Content ── */}
      {isExpanded && (
        <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-divider space-y-4 anim-fade-in text-xs">
          {/* Detailed Instructions */}
          <div className="mt-3">
            <span className="text-[11px] font-semibold text-subtle uppercase tracking-wider block mb-1">
              Instructions
            </span>
            <p className="text-ink leading-relaxed whitespace-pre-wrap">{step.instructions}</p>
          </div>

          {/* Rationale & Supporting Evidence */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-canvas/70 rounded-lg border border-edge">
              <span className="text-[10px] font-semibold text-subtle uppercase tracking-wider block mb-1">
                Strategic Rationale
              </span>
              <p className="text-muted leading-relaxed">{step.rationale}</p>
            </div>

            <div className="p-3 bg-canvas/70 rounded-lg border border-edge">
              <span className="text-[10px] font-semibold text-subtle uppercase tracking-wider block mb-1">
                Customer Evidence Linking
              </span>
              {step.supportingEvidence && step.supportingEvidence.length > 0 ? (
                <ul className="space-y-1">
                  {step.supportingEvidence.map((ev, i) => (
                    <li key={i} className="text-muted leading-tight flex items-start gap-1.5">
                      <span className="mt-1 w-1 h-1 rounded-full bg-brand shrink-0" />
                      <span>&ldquo;{ev}&rdquo;</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-subtle italic">Derived from lead parameters.</p>
              )}
            </div>
          </div>

          {/* Execution Checkpoints (Expected Outcome, Completion Criteria, Contingency) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-[11px]">
            <div className="p-2.5 rounded bg-raised/40 border border-edge">
              <span className="text-subtle font-medium block mb-0.5">Expected Outcome</span>
              <span className="text-ink font-medium">{step.expectedOutcome}</span>
            </div>
            <div className="p-2.5 rounded bg-raised/40 border border-edge">
              <span className="text-subtle font-medium block mb-0.5">Completion Criteria</span>
              <span className="text-ink font-medium">{step.completionCriteria}</span>
            </div>
            <div className="p-2.5 rounded bg-raised/40 border border-edge">
              <span className="text-subtle font-medium block mb-0.5">Contingency</span>
              <span className="text-ink font-medium">{step.contingency}</span>
            </div>
          </div>

          {/* ── Personalised Communication Draft ── */}
          {draft && (
            <div className="mt-4 p-4 rounded-xl border border-accent/30 bg-accent/[0.03]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded bg-accent text-accent-fg">
                    {draft.channel === "whatsapp" ? (
                      <MessageSquare className="w-3.5 h-3.5" />
                    ) : draft.channel === "call_script" ? (
                      <Phone className="w-3.5 h-3.5" />
                    ) : (
                      <Mail className="w-3.5 h-3.5" />
                    )}
                  </span>
                  <span className="font-semibold text-ink text-xs uppercase tracking-wider">
                    Personalized {draft.channel.replace("_", " ")} Draft
                  </span>
                  <span className="text-[10px] text-muted font-medium px-2 py-0.5 rounded bg-raised">
                    Tone: {draft.suggestedTone}
                  </span>
                </div>

                <button
                  onClick={() => handleCopy(draft.draft)}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-brand hover:opacity-80 transition-opacity rounded border border-edge bg-canvas shadow-2xs"
                >
                  {copiedDraft ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-positive" />
                      <span className="text-positive">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy response</span>
                    </>
                  )}
                </button>
              </div>

              {/* Draft text */}
              <div className="p-3 bg-canvas rounded-lg border border-divider text-ink font-sans leading-relaxed whitespace-pre-wrap text-xs selection:bg-accent">
                {draft.draft}
              </div>

              {/* Verification Checklist */}
              {draft.verificationChecklist && draft.verificationChecklist.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-divider/60">
                  <span className="text-[10px] font-semibold text-subtle uppercase tracking-wider block mb-1">
                    Pre-Flight Fact Check (Verify before making claims):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {draft.verificationChecklist.map((checkItem, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-raised text-muted text-[10px] border border-edge"
                      >
                        <AlertTriangle className="w-2.5 h-2.5 text-caution" />
                        {checkItem}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Conditional Decision Branches ── */}
          {step.decisionBranches && step.decisionBranches.length > 0 && (
            <div className="mt-3">
              <span className="text-[11px] font-semibold text-subtle uppercase tracking-wider block mb-2">
                Conditional Decision Branches
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {step.decisionBranches.map((branch, bIdx) => (
                  <div
                    key={bIdx}
                    className="p-3 rounded-lg border border-edge bg-canvas/60 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-ink text-[11px]">
                          IF: {branch.condition}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider border ${
                            IMPACT_COLORS[branch.planImpact] || IMPACT_COLORS.proceed
                          }`}
                        >
                          {branch.planImpact}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted italic mb-1.5">
                        Trigger: {branch.triggerEvidence}
                      </p>
                      <p className="text-[11px] text-ink font-medium leading-snug">
                        Action: {branch.recommendedAction}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Action Integrations */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-divider/60">
            <span className="text-[10px] text-subtle">
              Step {step.sequence} of {totalSteps}
            </span>
            <div className="flex items-center gap-2">
              {onOpenCoach && (
                <button
                  onClick={() => onOpenCoach(step)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium text-muted hover:text-ink hover:bg-raised border border-edge transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-accent" />
                  <span>Discuss with AI Coach</span>
                </button>
              )}
              {onOpenRehearsal && (
                <button
                  onClick={() => onOpenRehearsal(step)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium text-muted hover:text-ink hover:bg-raised border border-edge transition-colors"
                >
                  <Target className="w-3.5 h-3.5 text-accent" />
                  <span>Practise Objection</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
