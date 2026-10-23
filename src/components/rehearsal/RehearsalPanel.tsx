"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  X,
  Send,
  Target,
  Shield,
  Star,
  RotateCcw,
  Sparkles,
  Bot,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Copy,
  Check,
  ArrowRight,
  Info,
  ChevronDown,
  Zap,
} from "lucide-react";
import type {
  Lead,
  RehearsalMessage,
  RehearsalFeedback,
  RehearsalSession,
  RehearsalScenarioType,
  ExtractedObjection,
  RubricDimension,
} from "@/types/lead";
import { generateId } from "@/lib/utils/format";
import {
  loadRehearsalSessionForLead,
  saveRehearsalSession,
  deleteRehearsalSessionForLead,
} from "@/lib/storage/local-store";
import { formatPriorityDisplay, PRIORITY_STYLES } from "@/lib/leads/scoring";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface RehearsalPanelProps {
  lead: Lead;
  initialObjection?: ExtractedObjection;
  initialScenarioType?: RehearsalScenarioType;
  onClose?: () => void;
  onUpdateSession?: (session: RehearsalSession) => void;
  isFullPage?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function RehearsalPanel({
  lead,
  initialObjection,
  initialScenarioType,
  onClose,
  onUpdateSession,
}: RehearsalPanelProps) {
  const availableObjections: ExtractedObjection[] = useMemo(() => {
    const list = lead.analysis?.objections ?? [];
    if (list.length > 0) return list;
    return [
      {
        label: "Pricing & Possession Schedule",
        severity: "medium" as const,
        recommendedHandling: "Highlight verified RERA credentials and compare carpet area with local peers.",
      },
    ];
  }, [lead.analysis?.objections]);

  // Load existing session or initialize new
  const existingSession = useMemo(() => {
    return loadRehearsalSessionForLead(lead.id) || lead.rehearsalSession || null;
  }, [lead.id, lead.rehearsalSession]);

  const isConfirmedImmediate = useMemo(() => {
    const msg = (lead.customerMessage || "").toLowerCase();
    return (
      lead.buyingTimeline === "immediate" ||
      lead.priority?.band === "hot" ||
      msg.includes("immediate") ||
      msg.includes("ready to visit") ||
      msg.includes("this weekend") ||
      msg.includes("right away")
    );
  }, [lead.buyingTimeline, lead.priority.band, lead.customerMessage]);

  const [scenarioMode, setScenarioMode] = useState<RehearsalScenarioType>(() => {
    if (initialScenarioType) return initialScenarioType;
    if (initialObjection) return "documented_concern";
    if (existingSession?.scenarioType) return existingSession.scenarioType;
    return "immediate_buyer"; // Default to Immediate Buyer as prominent first-class option
  });

  const [selectedObjection, setSelectedObjection] = useState<ExtractedObjection>(() => {
    if (initialObjection) return initialObjection;
    if (existingSession?.targetObjection) {
      const match = availableObjections.find(
        (o) => o.label.toLowerCase() === existingSession.targetObjection?.toLowerCase()
      );
      if (match) return match;
    }
    return availableObjections[0];
  });

  const [messages, setMessages] = useState<RehearsalMessage[]>(() => {
    if (existingSession?.messages && existingSession.messages.length > 0) {
      return existingSession.messages;
    }
    return lead.rehearsalMessages && lead.rehearsalMessages.length > 0
      ? lead.rehearsalMessages
      : [];
  });

  const [feedback, setFeedback] = useState<RehearsalFeedback | null>(() => {
    return existingSession?.feedback || null;
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMode, setLoadingMode] = useState<"roleplay" | "coach" | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);
  const [showDebriefView, setShowDebriefView] = useState(() => Boolean(existingSession?.feedback));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSwitchingObjection, setIsSwitchingObjection] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll transcript when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, feedback, showDebriefView]);

  // Sync session to local storage
  const persistSession = useCallback(
    (
      newMessages: RehearsalMessage[],
      newFeedback: RehearsalFeedback | null,
      status: RehearsalSession["status"] = "in_progress"
    ) => {
      const isHypothetical = scenarioMode === "immediate_buyer" && !isConfirmedImmediate;
      const sessionTitle =
        scenarioMode === "immediate_buyer"
          ? "Immediate Buyer — Ready to Move Forward"
          : selectedObjection.label;

      const sessionObjective =
        scenarioMode === "immediate_buyer"
          ? `Guide high-intent buyer ${lead.name} from their immediate requirement to a concrete next step.`
          : `Address ${selectedObjection.label} with grounded evidence and secure a private site walkthrough.`;

      const session: RehearsalSession = {
        sessionId: existingSession?.sessionId || `rehearsal-${lead.id}-${generateId()}`,
        leadId: lead.id,
        scenarioType: scenarioMode,
        scenarioTitle: sessionTitle,
        isHypothetical,
        targetObjection: scenarioMode === "documented_concern" ? selectedObjection.label : undefined,
        objective: sessionObjective,
        messages: newMessages,
        feedback: newFeedback,
        status,
        startedAt: existingSession?.startedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      saveRehearsalSession(session);
      if (onUpdateSession) {
        onUpdateSession(session);
      }
    },
    [existingSession, lead.id, lead.name, scenarioMode, isConfirmedImmediate, selectedObjection.label, onUpdateSession]
  );

  // Reset/Restart Scenario
  const handleRestart = (newMode?: RehearsalScenarioType) => {
    const activeMode =
      typeof newMode === "string" && (newMode === "immediate_buyer" || newMode === "documented_concern")
        ? newMode
        : scenarioMode;
    const isHypothetical = activeMode === "immediate_buyer" && !isConfirmedImmediate;
    deleteRehearsalSessionForLead(lead.id);
    setMessages([]);
    setFeedback(null);
    setShowDebriefView(false);
    setErrorMessage(null);
    if (onUpdateSession) {
      const nowIso = new Date().toISOString();
      onUpdateSession({
        sessionId: `rehearsal-${lead.id}-${generateId()}`,
        leadId: lead.id,
        scenarioType: activeMode,
        scenarioTitle:
          activeMode === "immediate_buyer"
            ? "Immediate Buyer — Ready to Move Forward"
            : selectedObjection.label,
        isHypothetical,
        targetObjection: activeMode === "documented_concern" ? selectedObjection.label : undefined,
        objective:
          activeMode === "immediate_buyer"
            ? `Guide high-intent buyer ${lead.name} from their immediate requirement to a concrete next step.`
            : `Address ${selectedObjection.label}`,
        messages: [],
        feedback: null,
        status: "in_progress",
        startedAt: nowIso,
        updatedAt: nowIso,
      });
    }
  };

  // Switch between Immediate Buyer and Documented Concern
  const handleSwitchScenarioMode = (newMode: RehearsalScenarioType) => {
    if (newMode === scenarioMode) return;
    setScenarioMode(newMode);
    setIsSwitchingObjection(false);
    handleRestart(newMode);
  };

  // Send message or trigger turn
  const handleSendMessage = async (textToSend?: string, modeOverride?: "roleplay" | "coach") => {
    const mode = modeOverride || "roleplay";
    const content = (textToSend !== undefined ? textToSend : input).trim();

    // If roleplay and not an opening trigger, require content
    if (mode === "roleplay" && !content && messages.length > 0) return;
    if (loading) return;

    setErrorMessage(null);
    setInput("");
    setLoading(true);
    setLoadingMode(mode);

    let updatedHistory = [...messages];

    // If salesperson is speaking, append their message
    if (mode === "roleplay" && content) {
      const spMsg: RehearsalMessage = {
        id: generateId(),
        role: "salesperson",
        content,
        timestamp: new Date().toISOString(),
      };
      updatedHistory = [...updatedHistory, spMsg];
      setMessages(updatedHistory);
    }

    try {
      const res = await fetch("/api/leads/rehearsal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          scenarioType: scenarioMode,
          isHypothetical: scenarioMode === "immediate_buyer" && !isConfirmedImmediate,
          message: content,
          targetObjection: scenarioMode === "documented_concern" ? selectedObjection : undefined,
          objective:
            scenarioMode === "immediate_buyer"
              ? `Guide high-intent buyer ${lead.name} from their immediate requirement to a concrete next step.`
              : `Overcome ${selectedObjection.label} and secure walkthrough`,
          leadContext: {
            id: lead.id,
            name: lead.name,
            location: lead.location,
            propertyRequirement: lead.propertyRequirement,
            budget: lead.budget,
            buyingTimeline: lead.buyingTimeline,
            customerMessage: lead.customerMessage,
            objections: availableObjections,
            analysis: lead.analysis
              ? {
                  summary: lead.analysis.summary,
                  intent: lead.analysis.intent,
                  recommendedAction: lead.analysis.recommendedAction,
                }
              : null,
          },
          history: updatedHistory.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();

      if (mode === "coach") {
        if (data.feedback) {
          setFeedback(data.feedback);
          setShowDebriefView(true);
          persistSession(updatedHistory, data.feedback, "debrief_ready");
        } else {
          throw new Error("Coaching debrief returned empty feedback");
        }
      } else {
        // Buyer reply
        const buyerMsg: RehearsalMessage = {
          id: generateId(),
          role: "customer",
          content: data.customerReply || "...",
          timestamp: new Date().toISOString(),
        };
        const nextHistory = [...updatedHistory, buyerMsg];
        setMessages(nextHistory);
        persistSession(nextHistory, feedback, "in_progress");
      }
    } catch (err) {
      console.error("[Rehearsal] API call failed:", err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Rehearsal service unavailable. Please check your network or server configuration."
      );
    } finally {
      setLoading(false);
      setLoadingMode(null);
    }
  };

  // Trigger AI buyer opening turn
  const handleStartOpeningTurn = () => {
    handleSendMessage("", "roleplay");
  };

  // Request Coaching Debrief
  const handleRequestDebrief = () => {
    if (messages.length === 0 || loading) return;
    handleSendMessage("", "coach");
  };

  // Switch to another objection
  const handleSelectObjection = (obj: ExtractedObjection) => {
    setSelectedObjection(obj);
    setIsSwitchingObjection(false);
    if (messages.length > 0) {
      handleRestart("documented_concern");
    }
  };

  // Copy suggested alternative script
  const handleCopyScript = (scriptText: string) => {
    navigator.clipboard.writeText(scriptText);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const salespersonTurnCount = messages.filter((m) => m.role === "salesperson").length;

  return (
    <div className="flex flex-col h-full bg-canvas text-ink border-l border-edge select-text">
      {/* ── Studio Header ── */}
      <div className="shrink-0 px-4 py-3 border-b border-edge bg-panel/70 backdrop-blur-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center text-brand shrink-0">
              {scenarioMode === "immediate_buyer" ? (
                <Zap className="w-4 h-4 text-brand" />
              ) : (
                <Target className="w-4 h-4 text-brand" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-ink truncate">
                  {scenarioMode === "immediate_buyer"
                    ? "Immediate Buyer Practice"
                    : "Objection Rehearsal"}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${PRIORITY_STYLES[lead.priority.band].badgeCompactClass} shrink-0`}>
                  {formatPriorityDisplay(lead.priority.band, lead.priority.total)}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium uppercase bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 shrink-0">
                  Simulation Studio
                </span>
              </div>
              <p className="text-[11px] text-subtle truncate">
                Simulating buyer <strong className="text-muted font-medium">{lead.name}</strong> •{" "}
                {scenarioMode === "immediate_buyer" ? "Ready to Move Forward" : selectedObjection.label} • {lead.location}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {messages.length > 0 && (
              <button
                onClick={() => handleRestart()}
                className="h-8 px-2.5 flex items-center gap-1.5 text-xs text-muted hover:text-ink hover:bg-raised rounded-md transition-colors"
                title="Restart this rehearsal"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Restart</span>
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-md text-subtle hover:text-ink hover:bg-raised transition-colors"
                aria-label="Exit Rehearsal"
                title="Exit to Lead Analysis"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* ── Scenario Selection Mode (First-class Immediate Buyer vs Documented Concern) ── */}
        <div className="mt-2.5 pt-2.5 border-t border-edge/60 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-subtle flex items-center gap-1">
              <Target className="w-3 h-3 text-brand" />
              Practice Scenario
            </span>
            {scenarioMode === "immediate_buyer" ? (
              isConfirmedImmediate ? (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Confirmed High Intent
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20" title="Lead timeline is not marked immediate; practicing hypothetical accelerated intent">
                  Hypothetical Scenario
                </span>
              )
            ) : (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                Documented Concern
              </span>
            )}
          </div>

          {/* Mode Selector Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-raised/50 border border-edge rounded-lg">
            <button
              type="button"
              onClick={() => handleSwitchScenarioMode("immediate_buyer")}
              className={`px-2.5 py-1.5 rounded-md text-left transition-all flex flex-col gap-0.5 ${
                scenarioMode === "immediate_buyer"
                  ? "bg-panel text-ink shadow-2xs border border-brand/30"
                  : "text-muted hover:text-ink hover:bg-raised/60"
              }`}
            >
              <div className="flex items-center gap-1.5 font-semibold text-xs text-brand">
                <Zap className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Immediate Buyer</span>
              </div>
              <span className="text-[10px] text-subtle truncate">Ready to move forward</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchScenarioMode("documented_concern")}
              className={`px-2.5 py-1.5 rounded-md text-left transition-all flex flex-col gap-0.5 ${
                scenarioMode === "documented_concern"
                  ? "bg-panel text-ink shadow-2xs border border-brand/30"
                  : "text-muted hover:text-ink hover:bg-raised/60"
              }`}
            >
              <div className="flex items-center gap-1.5 font-semibold text-xs text-ink">
                <Shield className="w-3.5 h-3.5 shrink-0 text-muted" />
                <span className="truncate">Documented Concern</span>
              </div>
              <span className="text-[10px] text-subtle truncate">
                {availableObjections.length} documented
              </span>
            </button>
          </div>

          {/* Scenario Details Card */}
          {scenarioMode === "immediate_buyer" ? (
            <div className="p-2.5 rounded-lg bg-raised/40 border border-brand/20 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-brand" />
                  Immediate Buyer — Ready to Move Forward
                </span>
                {isConfirmedImmediate ? (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Active Intent
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Hypothetical
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted leading-relaxed">
                Practise guiding a high-intent buyer from their immediate requirement to a concrete next step.
              </p>
              {!isConfirmedImmediate && (
                <p className="text-[10px] text-amber-600 dark:text-amber-400 italic">
                  * Note: {lead.name}&apos;s verified timeline is not immediate; practicing hypothetical accelerated intent.
                </p>
              )}
            </div>
          ) : (
            <div>
              <div className="p-2.5 rounded-lg bg-raised/50 border border-edge flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-ink">{selectedObjection.label}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-mono uppercase ${
                        selectedObjection.severity === "high"
                          ? "bg-danger/10 text-danger border border-danger/20"
                          : selectedObjection.severity === "medium"
                          ? "bg-caution/10 text-caution border border-caution/20"
                          : "bg-subtle/10 text-subtle border border-edge"
                      }`}
                    >
                      {selectedObjection.severity}
                    </span>
                  </div>
                  {selectedObjection.evidenceQuote && (
                    <p className="text-[11px] text-muted italic mt-0.5 line-clamp-1">
                      &ldquo;{selectedObjection.evidenceQuote}&rdquo;
                    </p>
                  )}
                </div>
                {availableObjections.length > 1 && (
                  <button
                    onClick={() => setIsSwitchingObjection((v) => !v)}
                    className="text-[11px] text-brand hover:underline flex items-center gap-0.5 shrink-0"
                  >
                    Switch Concern
                    <ChevronDown className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Dropdown for alternative objections */}
              {isSwitchingObjection && (
                <div className="mt-2 space-y-1.5 p-2 rounded-lg bg-panel border border-edge shadow-md anim-fade-in">
                  <p className="text-[10px] text-subtle font-medium px-1">Select documented concern to practice:</p>
                  {availableObjections.map((obj, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectObjection(obj)}
                      className={`w-full text-left p-2 rounded-md text-xs transition-colors flex items-center justify-between ${
                        obj.label === selectedObjection.label
                          ? "bg-brand/10 text-brand font-medium border border-brand/20"
                          : "hover:bg-raised text-ink"
                      }`}
                    >
                      <span className="truncate">{obj.label}</span>
                      <span className="text-[9px] uppercase font-mono text-subtle ml-2 shrink-0">{obj.severity}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Simulation disclaimer banner */}
          <div className="flex items-start gap-1.5 px-2.5 py-1.5 rounded-md bg-violet-500/5 border border-violet-500/15 text-[10px] text-violet-700 dark:text-violet-300">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-violet-500" />
            <span className="leading-tight">
              <strong>Fictional Buyer Simulation:</strong> AI simulates {lead.name}&apos;s persona. Practice content is strictly isolated and never alters verified customer evidence.
            </span>
          </div>
        </div>
      </div>

      {/* ── Subheader Action Bar (Debrief Toggle & Status) ── */}
      <div className="shrink-0 px-4 py-2 border-b border-edge/80 bg-raised/20 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted">
            Exchanges: <strong className="text-ink font-semibold">{salespersonTurnCount}</strong>
          </span>
          {feedback && (
            <button
              onClick={() => setShowDebriefView((v) => !v)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                showDebriefView
                  ? "bg-brand text-brand-fg font-semibold"
                  : "bg-brand/10 text-brand hover:bg-brand/20"
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>{showDebriefView ? "View Transcript" : `Coach Score: ${feedback.score}/10`}</span>
            </button>
          )}
        </div>

        {/* Request Coaching Debrief Button */}
        {messages.length > 0 && !showDebriefView && (
          <button
            onClick={handleRequestDebrief}
            disabled={loading}
            className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-accent text-accent-fg hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center gap-1.5 shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{feedback ? "Re-evaluate Transcript" : "Request Coaching Debrief"}</span>
          </button>
        )}
      </div>

      {/* ── Studio Body (Transcript or Debrief) ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Error message banner */}
        {errorMessage && (
          <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-xs text-danger flex items-start gap-2 anim-fade-in">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Rehearsal Request Failed</p>
              <p className="text-[11px] opacity-90 mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* ── DEBRIEF VIEW ── */}
        {showDebriefView && feedback ? (
          <div className="space-y-4 anim-fade-in">
            {/* Top Score Banner */}
            <div className="p-4 rounded-xl border border-brand/30 bg-gradient-to-br from-brand/10 via-panel to-canvas relative overflow-hidden">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="w-4 h-4 text-brand fill-brand" />
                    <span className="text-xs font-bold uppercase tracking-wider text-brand">
                      {scenarioMode === "immediate_buyer" ? "Immediate Buyer Debrief" : "Rehearsal Debrief"}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-ink">
                    {scenarioMode === "immediate_buyer"
                      ? "Immediate Buyer Technique Evaluation"
                      : "Technique Evaluation"}
                  </h4>
                  {feedback.summary && (
                    <p className="text-xs text-muted mt-1 leading-relaxed">{feedback.summary}</p>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <div className="text-3xl font-extrabold text-ink font-mono tracking-tight">
                    {feedback.score}
                    <span className="text-sm font-normal text-subtle">/10</span>
                  </div>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold mt-1 uppercase ${
                      feedback.score >= 8
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : feedback.score >= 5
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : "bg-danger/10 text-danger"
                    }`}
                  >
                    {feedback.score >= 8
                      ? "Effective Dialogue"
                      : feedback.score >= 5
                      ? "Good Foundations"
                      : "Needs Calibration"}
                  </span>
                </div>
              </div>

              {/* Concern/Need Addressed Callout */}
              <div
                className={`mt-3 p-2.5 rounded-lg border text-xs flex items-start gap-2 ${
                  feedback.concernAddressed.addressed
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                    : "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300"
                }`}
              >
                {feedback.concernAddressed.addressed ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                )}
                <div>
                  <span className="font-semibold block">
                    {feedback.concernAddressed.addressed
                      ? scenarioMode === "immediate_buyer"
                        ? "Immediate Requirement Addressed"
                        : "Target Concern Addressed"
                      : scenarioMode === "immediate_buyer"
                      ? "Immediate Requirement Unresolved"
                      : "Target Concern Still Unresolved"}
                  </span>
                  <span className="text-[11px] opacity-90 mt-0.5 leading-snug">
                    {feedback.concernAddressed.explanation}
                  </span>
                </div>
              </div>
            </div>

            {/* ── 4-Dimension Rubric Scorecard ── */}
            <div className="p-3.5 rounded-xl border border-edge bg-panel space-y-3">
              <h5 className="text-xs font-semibold uppercase tracking-wider text-subtle flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-brand" />
                Coaching Rubric Dimensions (1 to 5)
              </h5>

              <div className="grid grid-cols-1 gap-2.5">
                {feedback.dimensions.map((dim: RubricDimension, i: number) => (
                  <div key={i} className="p-2.5 rounded-lg bg-raised/40 border border-edge/60 text-xs">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-semibold text-ink">{dim.label}</span>
                      <div className="flex items-center gap-1.5">
                        {/* Rating bar */}
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((lvl) => (
                            <div
                              key={lvl}
                              className={`w-3.5 h-1.5 rounded-xs ${
                                lvl <= dim.score ? "bg-brand" : "bg-edge"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-mono text-[11px] font-bold text-ink ml-1">
                          {dim.score}/5
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted leading-relaxed">{dim.explanation}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Strengths & Improvements ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Strengths */}
              <div className="p-3 rounded-xl border border-edge bg-panel text-xs space-y-2">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  What You Handled Well
                </span>
                <ul className="space-y-1.5">
                  {feedback.strengths.map((str, i) => (
                    <li key={i} className="text-[11px] text-muted flex items-start gap-1.5 leading-snug">
                      <span className="w-1 h-1 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Improvements */}
              <div className="p-3 rounded-xl border border-edge bg-panel text-xs space-y-2">
                <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 text-xs">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Areas to Polish
                </span>
                <ul className="space-y-1.5">
                  {feedback.improvements.map((imp, i) => (
                    <li key={i} className="text-[11px] text-muted flex items-start gap-1.5 leading-snug">
                      <span className="w-1 h-1 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* ── Single Key Specific Improvement ── */}
            {feedback.keyImprovement && (
              <div className="p-3.5 rounded-xl border border-brand/30 bg-brand/5 text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-brand font-semibold text-xs">
                  <Lightbulb className="w-3.5 h-3.5" />
                  Key Actionable Improvement
                </div>
                <p className="text-xs text-ink leading-relaxed font-medium">
                  {feedback.keyImprovement}
                </p>
              </div>
            )}

            {/* ── Suggested Stronger Script ── */}
            {feedback.suggestedAlternative && (
              <div className="p-3.5 rounded-xl border border-edge bg-panel space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-brand" />
                    Suggested Stronger Response
                  </span>
                  <button
                    onClick={() => handleCopyScript(feedback.suggestedAlternative)}
                    className="h-7 px-2 flex items-center gap-1 text-[11px] text-brand hover:bg-brand/10 rounded transition-colors"
                  >
                    {copiedScript ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Script</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-3 rounded-lg bg-canvas border border-edge/80 text-xs text-ink leading-relaxed italic select-all">
                  &ldquo;{feedback.suggestedAlternative}&rdquo;
                </div>
              </div>
            )}

            {/* ── Explicit Rubric Disclaimer ── */}
            <div className="p-2.5 rounded-lg bg-raised/30 border border-edge text-[10px] text-subtle leading-relaxed flex items-start gap-2">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-subtle" />
              <span>
                {feedback.disclaimer ||
                  "Subjective coaching scores evaluate conversational technique and adherence to best practices. They do not predict commercial closing probability or client conversion."}
              </span>
            </div>

            {/* ── Debrief Footer Actions ── */}
            <div className="pt-2 flex items-center justify-between gap-2 border-t border-edge">
              <button
                onClick={() => setShowDebriefView(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-muted hover:text-ink hover:bg-raised transition-colors"
              >
                Back to Transcript
              </button>
              <button
                onClick={() => handleRestart()}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-brand text-brand-fg hover:opacity-90 transition-opacity flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry Scenario</span>
              </button>
            </div>
          </div>
        ) : (
          /* ── TRANSCRIPT VIEW ── */
          <>
            {/* Zero state: Explain scenario & provide opening triggers */}
            {messages.length === 0 && (
              <div className="py-6 px-3 text-center space-y-4 max-w-md mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand mx-auto shadow-xs">
                  {scenarioMode === "immediate_buyer" ? (
                    <Zap className="w-6 h-6" />
                  ) : (
                    <Target className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-ink">
                    {scenarioMode === "immediate_buyer"
                      ? "Ready to Practise Immediate Buyer"
                      : "Ready to Practise"}
                  </h4>
                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    {scenarioMode === "immediate_buyer" ? (
                      <>
                        Practise guiding <strong>{lead.name}</strong> from their immediate requirement (
                        <em>{lead.propertyRequirement}</em> in {lead.location}) to a confirmed next step.
                      </>
                    ) : (
                      <>
                        Test your rebuttal techniques against a realistic AI simulation of{" "}
                        <strong>{lead.name}</strong> voicing concern over{" "}
                        <em>{selectedObjection.label}</em>.
                      </>
                    )}
                  </p>
                </div>

                {/* Primary Opening Button */}
                <button
                  onClick={handleStartOpeningTurn}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-brand text-brand-fg hover:opacity-90 font-semibold text-xs shadow-xs transition-opacity flex items-center justify-center gap-2"
                >
                  <Bot className="w-4 h-4" />
                  <span>
                    {scenarioMode === "immediate_buyer"
                      ? "Start Simulation (Simulated Buyer Opens with Request)"
                      : "Start Simulation (Simulated Buyer Opens)"}
                  </span>
                </button>

                {/* Or suggested salesperson openers */}
                <div className="pt-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-subtle block mb-2">
                    Or Initiate as Salesperson:
                  </span>
                  <div className="space-y-2">
                    {scenarioMode === "immediate_buyer" ? (
                      <>
                        <button
                          onClick={() =>
                            handleSendMessage(
                              `Hi ${lead.name.split(" ")[0]}, we have verified ${lead.propertyRequirement} units ready for immediate inspection in ${lead.location}. I have reserved walkthrough windows this Saturday at 11:00 AM or Sunday at 3:30 PM. Which time works best for you?`
                            )
                          }
                          disabled={loading}
                          className="w-full text-left p-2.5 rounded-lg border border-edge bg-raised/40 hover:bg-raised text-xs text-muted hover:text-ink transition-colors flex items-center justify-between group"
                        >
                          <span className="line-clamp-2">
                            &ldquo;Hi {lead.name.split(" ")[0]}, we have verified {lead.propertyRequirement} units ready... I have reserved walkthrough windows Saturday 11 AM or Sunday 3:30 PM...&rdquo;
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-subtle group-hover:text-ink shrink-0 ml-2" />
                        </button>

                        <button
                          onClick={() =>
                            handleSendMessage(
                              `Hello ${lead.name.split(" ")[0]}, thank you for reaching out! I've prepared the full floor plan and pricing sheet for ${lead.location}. Let's schedule a 20-minute private walkthrough this weekend.`
                            )
                          }
                          disabled={loading}
                          className="w-full text-left p-2.5 rounded-lg border border-edge bg-raised/40 hover:bg-raised text-xs text-muted hover:text-ink transition-colors flex items-center justify-between group"
                        >
                          <span className="line-clamp-2">
                            &ldquo;Hello {lead.name.split(" ")[0]}, I&apos;ve prepared the full floor plan and pricing sheet... Let&apos;s schedule a private walkthrough this weekend...&rdquo;
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-subtle group-hover:text-ink shrink-0 ml-2" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() =>
                            handleSendMessage(
                              `Hi ${lead.name.split(" ")[0]}, regarding your interest in ${lead.location}, I noticed your inquiry mentioned ${selectedObjection.label.toLowerCase()}. I wanted to directly share how our project handles this.`
                            )
                          }
                          disabled={loading}
                          className="w-full text-left p-2.5 rounded-lg border border-edge bg-raised/40 hover:bg-raised text-xs text-muted hover:text-ink transition-colors flex items-center justify-between group"
                        >
                          <span className="line-clamp-2">
                            &ldquo;Hi {lead.name.split(" ")[0]}, I wanted to directly address your question about {selectedObjection.label.toLowerCase()}...&rdquo;
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-subtle group-hover:text-ink shrink-0 ml-2" />
                        </button>

                        <button
                          onClick={() =>
                            handleSendMessage(
                              `Hello ${lead.name.split(" ")[0]}, thank you for reaching out! We have two move-in ready ${lead.propertyRequirement} units matching your budget in ${lead.location}.`
                            )
                          }
                          disabled={loading}
                          className="w-full text-left p-2.5 rounded-lg border border-edge bg-raised/40 hover:bg-raised text-xs text-muted hover:text-ink transition-colors flex items-center justify-between group"
                        >
                          <span className="line-clamp-2">
                            &ldquo;Hello {lead.name.split(" ")[0]}, we have verified units matching your budget...&rdquo;
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-subtle group-hover:text-ink shrink-0 ml-2" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Message Transcript ── */}
            {messages.map((msg) => {
              const isSalesperson = msg.role === "salesperson";
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 max-w-[92%] ${
                    isSalesperson ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
                >
                  {/* Role Avatar */}
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold shadow-2xs ${
                      isSalesperson
                        ? "bg-brand text-brand-fg font-semibold"
                        : "bg-violet-600/10 text-violet-600 dark:text-violet-400 border border-violet-500/20"
                    }`}
                  >
                    {isSalesperson ? "You" : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  <div className={`space-y-1 ${isSalesperson ? "items-end text-right" : "items-start text-left"}`}>
                    <div className="flex items-center gap-1.5 text-[10px] text-subtle">
                      <span className="font-semibold text-muted">
                        {isSalesperson
                          ? "You (Salesperson)"
                          : `Simulated Buyer (${lead.name}${scenarioMode === "immediate_buyer" ? " — Ready to Move Forward" : ""})`}
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div
                      className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm leading-relaxed ${
                        isSalesperson
                          ? "bg-brand text-brand-fg rounded-tr-xs shadow-xs font-medium"
                          : "bg-panel text-ink rounded-tl-xs border border-edge shadow-xs"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* In-flight typing indicator */}
            {loading && (
              <div className="mr-auto max-w-[90%] flex gap-2.5 anim-fade-in">
                <div className="w-7 h-7 rounded-lg bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-600 shrink-0">
                  <Bot className="w-3.5 h-3.5 animate-pulse" />
                </div>
                <div className="px-3.5 py-2.5 rounded-xl bg-panel border border-edge rounded-tl-xs shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-subtle italic">
                      {loadingMode === "coach"
                        ? "AI Sales Coach evaluating rehearsal transcript..."
                        : scenarioMode === "immediate_buyer"
                        ? `Simulating ${lead.name}'s buyer response (Ready to Move Forward)...`
                        : `Simulating ${lead.name}'s buyer response...`}
                    </span>
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Salesperson Composer (Active when in transcript view) ── */}
      {!showDebriefView && (
        <div className="shrink-0 p-3.5 border-t border-edge bg-panel/70">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="space-y-2"
          >
            <div className="relative rounded-xl border border-edge bg-canvas focus-within:border-brand focus-within:ring-1 focus-within:ring-brand/30 transition-all shadow-xs">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={loading}
                rows={2}
                placeholder={
                  messages.length === 0
                    ? scenarioMode === "immediate_buyer"
                      ? `Type your opening statement to high-intent buyer ${lead.name}...`
                      : `Type your opening statement to ${lead.name}...`
                    : scenarioMode === "immediate_buyer"
                    ? `Type your response to ${lead.name} to advance next steps... (Enter to send)`
                    : `Type your response to ${lead.name}'s objection... (Enter to send)`
                }
                className="w-full px-3 py-2 text-xs sm:text-sm bg-transparent border-0 outline-hidden resize-none placeholder:text-subtle text-ink disabled:opacity-50"
              />

              <div className="flex items-center justify-between px-3 py-1.5 border-t border-edge/40 bg-raised/30 text-[10px] text-subtle">
                <span className="hidden sm:inline">
                  Press <kbd className="px-1 py-0.5 rounded bg-raised border border-edge text-[9px] font-mono">Enter</kbd> to send, <kbd className="px-1 py-0.5 rounded bg-raised border border-edge text-[9px] font-mono">Shift+Enter</kbd> for newline
                </span>
                <span className="sm:hidden text-[10px]">Tap send to reply</span>

                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="px-3 py-1 rounded-md bg-accent text-accent-fg font-semibold text-xs hover:opacity-90 disabled:opacity-30 transition-opacity flex items-center gap-1.5 shadow-2xs"
                >
                  <span>Send</span>
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
