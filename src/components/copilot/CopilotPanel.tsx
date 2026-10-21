"use client";

import { useState, useRef, useEffect } from "react";
import {
  X,
  Send,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Bot,
  User,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import type { Lead, CopilotMessage } from "@/types/lead";
import type { ChatResponse, AIErrorResponse } from "@/types/ai";
import { generateId, truncate, formatINR } from "@/lib/utils/format";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface CopilotPanelProps {
  lead: Lead;
  onClose: () => void;
  onUpdateMessages?: (messages: CopilotMessage[]) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function CopilotPanel({ lead, onClose, onUpdateMessages }: CopilotPanelProps) {
  const [messages, setMessages] = useState<CopilotMessage[]>(lead.copilotMessages || []);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync with prop when lead identity changes
  useEffect(() => {
    setMessages(lead.copilotMessages || []);
    setLastFailedMessage(null);
  }, [lead.id, lead.copilotMessages]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Generate dynamic starter prompts tailored to this specific lead
  const band = lead.priority?.band || "warm";
  const priorityQuestion =
    band === "hot"
      ? "Why is this lead Hot rather than Warm?"
      : band === "warm"
      ? "Why is this lead Warm rather than Hot?"
      : "Why is this lead Cold rather than Warm?";

  const starterQuestions = [
    "What should I emphasise on the call?",
    priorityQuestion,
    "Which important detail is still unknown?",
    "Make the suggested reply more assertive without becoming aggressive.",
    "How should I handle the concern about financing?",
    "What should I ask the customer next?",
    "Give me a 30-second call opener using this lead's actual context.",
  ];

  const handleSend = async (textToSend?: string) => {
    const msg = (textToSend || input).trim();
    if (!msg || loading) return;

    // Clear input box, but keep message in memory if network fails
    if (!textToSend) {
      setInput("");
    }
    setLastFailedMessage(null);

    const userMsg: CopilotMessage = {
      id: generateId(),
      role: "user",
      content: msg,
      timestamp: new Date().toISOString(),
    };

    const nextMessagesWithUser = [...messages, userMsg];
    setMessages(nextMessagesWithUser);
    onUpdateMessages?.(nextMessagesWithUser);
    setLoading(true);

    try {
      const res = await fetch("/api/leads/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          leadContext: {
            id: lead.id,
            name: lead.name,
            location: lead.location,
            propertyRequirement: lead.propertyRequirement,
            budget: lead.budget,
            buyingTimeline: lead.buyingTimeline,
            customerMessage: lead.customerMessage,
            priority: lead.priority
              ? { total: lead.priority.total, band: lead.priority.band }
              : undefined,
            analysis: lead.analysis
              ? {
                  summary: lead.analysis.summary,
                  intent: lead.analysis.intent,
                  requirements: lead.analysis.requirements,
                  objections: lead.analysis.objections,
                  recommendedAction: lead.analysis.recommendedAction,
                  suggestedResponse: lead.analysis.suggestedResponse,
                  missingInformation: lead.analysis.missingInformation,
                }
              : null,
            analysisSummary: lead.analysis?.summary ?? null,
          },
          history: nextMessagesWithUser.slice(-6).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.ok) {
        const errorData: AIErrorResponse = await res.json().catch(() => ({
          error: `HTTP ${res.status}: Failed to reach AI coach`,
          code: "PROVIDER_NETWORK_FAILURE" as const,
          status: res.status,
          meta: {
            provider: "offline-heuristic" as const,
            model: null,
            mode: "fallback" as const,
            fallbackUsed: true,
            latencyMs: 0,
          },
        }));
        throw new Error(errorData.error || `Server returned ${res.status}`);
      }

      const data: ChatResponse = await res.json();
      const assistantAnswer = data.answer || data.reply || "No response received.";

      const assistantMsg: CopilotMessage = {
        id: generateId(),
        role: "assistant",
        content: assistantAnswer,
        timestamp: new Date().toISOString(),
        supportingEvidence: data.supportingEvidence,
        uncertainties: data.uncertainties,
        suggestedNextQuestion: data.suggestedNextQuestion,
      };

      const finalMessages = [...nextMessagesWithUser, assistantMsg];
      setMessages(finalMessages);
      onUpdateMessages?.(finalMessages);
    } catch (err) {
      console.error("Copilot chat error:", err);
      setLastFailedMessage(msg);
      setInput(msg); // Restore user's input so they can easily retry or tweak

      const errorMsg: CopilotMessage = {
        id: generateId(),
        role: "assistant",
        content:
          err instanceof Error
            ? `Unable to complete request: ${err.message}`
            : "The AI coach request could not be completed. Please check your connection or retry.",
        timestamp: new Date().toISOString(),
        isError: true,
      };

      const finalMessages = [...nextMessagesWithUser, errorMsg];
      setMessages(finalMessages);
      onUpdateMessages?.(finalMessages);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReset = () => {
    if (messages.length > 0) {
      setMessages([]);
      onUpdateMessages?.([]);
      setLastFailedMessage(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-panel text-ink select-text">
      {/* Header with Active Lead Identity */}
      <div className="shrink-0 px-4 py-3 border-b border-edge bg-canvas/60">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-md bg-accent/20 text-brand dark:text-accent flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-ink truncate">AI Sales Coach</h3>
                <span
                  className={`px-1.5 py-0.5 text-[10px] font-medium rounded uppercase shrink-0 ${
                    band === "hot"
                      ? "bg-hot-fill text-hot"
                      : band === "warm"
                      ? "bg-warm-fill text-warm"
                      : "bg-cold-fill text-cold"
                  }`}
                >
                  {band} {lead.priority ? `(${lead.priority.total})` : ""}
                </span>
              </div>
              <p className="text-[11px] text-muted truncate">
                Context: <span className="font-medium text-ink">{lead.name}</span> • {lead.location} •{" "}
                {formatINR(lead.budget)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleReset}
              disabled={messages.length === 0}
              className="w-7 h-7 flex items-center justify-center rounded-md text-subtle hover:text-ink hover:bg-raised disabled:opacity-30 transition-colors"
              title="Reset conversation for this lead"
              aria-label="Reset conversation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-md text-subtle hover:text-ink hover:bg-raised transition-colors"
              title="Close sales coach panel"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Security & Isolation Pill */}
        <div className="mt-2 flex items-center gap-1.5 px-2 py-1 rounded bg-raised/70 border border-divider text-[10px] text-subtle">
          <ShieldAlert className="w-3 h-3 text-brand dark:text-accent shrink-0" />
          <span className="truncate">
            Isolated lead context: Customer text is shielded from prompt injection.
          </span>
        </div>
      </div>

      {/* Message Stream */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="py-4">
            <div className="text-center max-w-sm mx-auto mb-4">
              <div className="w-10 h-10 rounded-full bg-accent/20 text-brand dark:text-accent mx-auto flex items-center justify-center mb-2">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-semibold text-ink mb-1">
                Contextual Sales Guidance for {lead.name}
              </h4>
              <p className="text-[11px] text-muted leading-relaxed">
                Ask specific questions to qualify, unblock objections, or draft high-converting
                follow-ups based on this lead&apos;s verified analysis.
              </p>
            </div>

            {/* Starter Prompts */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-subtle px-1">
                Suggested Follow-up Prompts
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {starterQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    disabled={loading}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-muted hover:text-ink hover:bg-raised
                      rounded-md border border-divider hover:border-edge transition-all flex items-center justify-between group disabled:opacity-50"
                  >
                    <span className="line-clamp-2">{q}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-subtle opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
              >
                {/* Role Header */}
                <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-subtle">
                  {isUser ? (
                    <>
                      <span>Salesperson</span>
                      <User className="w-3 h-3" />
                    </>
                  ) : (
                    <>
                      <Bot className="w-3 h-3 text-brand dark:text-accent" />
                      <span className="font-medium text-ink">SignalDesk Coach</span>
                    </>
                  )}
                  <span>•</span>
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[92%] rounded-lg px-3.5 py-2.5 text-xs leading-relaxed ${
                    isUser
                      ? "bg-brand text-white rounded-tr-none shadow-xs"
                      : msg.isError
                      ? "bg-danger/10 text-danger border border-danger/30 rounded-tl-none shadow-xs"
                      : "bg-raised text-ink border border-edge rounded-tl-none shadow-xs"
                  }`}
                >
                  {/* Formatted Content */}
                  <div className="whitespace-pre-wrap space-y-1.5">
                    {msg.content}
                  </div>

                  {/* Supporting Grounded Evidence */}
                  {!isUser && msg.supportingEvidence && msg.supportingEvidence.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-divider">
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-brand dark:text-accent uppercase tracking-wider mb-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Verified Grounding</span>
                      </div>
                      <ul className="space-y-1">
                        {msg.supportingEvidence.map((ev, idx) => (
                          <li
                            key={idx}
                            className="text-[11px] text-muted flex items-start gap-1.5"
                          >
                            <span className="text-subtle">•</span>
                            <span>{ev}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Uncertainties / Incomplete Context */}
                  {!isUser && msg.uncertainties && msg.uncertainties.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-divider">
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-caution uppercase tracking-wider mb-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>Uncertainties & Context Gaps</span>
                      </div>
                      <ul className="space-y-1">
                        {msg.uncertainties.map((unc, idx) => (
                          <li
                            key={idx}
                            className="text-[11px] text-muted flex items-start gap-1.5"
                          >
                            <span className="text-caution">•</span>
                            <span>{unc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Suggested Next Question Interactive Pill */}
                  {!isUser && msg.suggestedNextQuestion && (
                    <div className="mt-3 pt-2 border-t border-divider">
                      <span className="text-[10px] font-medium text-subtle block mb-1">
                        Suggested Next Action
                      </span>
                      <button
                        onClick={() => handleSend(msg.suggestedNextQuestion)}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-canvas hover:bg-canvas/80 text-ink text-[11px] font-medium border border-edge hover:border-brand/40 transition-colors text-left group disabled:opacity-50"
                      >
                        <Sparkles className="w-3 h-3 text-accent group-hover:scale-110 transition-transform shrink-0" />
                        <span className="truncate">{msg.suggestedNextQuestion}</span>
                        <ArrowRight className="w-3 h-3 text-subtle ml-auto shrink-0" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Message Actions */}
                {!isUser && (
                  <div className="flex items-center gap-2 mt-1 px-1">
                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="text-[10px] text-subtle hover:text-ink transition-colors flex items-center gap-1"
                      title="Copy coach advice to clipboard"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-positive" />
                          <span className="text-positive font-medium">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy recommendation</span>
                        </>
                      )}
                    </button>

                    {msg.isError && lastFailedMessage && (
                      <button
                        onClick={() => handleSend(lastFailedMessage)}
                        disabled={loading}
                        className="text-[10px] font-medium text-danger hover:underline flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Retry</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Loading Bubble */}
        {loading && (
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-subtle">
              <Bot className="w-3 h-3 text-brand dark:text-accent" />
              <span className="font-medium text-ink">SignalDesk Coach</span>
              <span>• Thinking...</span>
            </div>
            <div className="bg-raised border border-divider rounded-lg rounded-tl-none px-3.5 py-2.5">
              <div className="flex items-center gap-2 text-xs text-muted">
                <Loader2 className="w-3.5 h-3.5 text-brand dark:text-accent animate-spin" />
                <span>Analysing {lead.name}&apos;s context...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Quick Chips (When messages exist) */}
      {messages.length > 0 && (
        <div className="shrink-0 px-3 py-1.5 border-t border-divider bg-canvas/40 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-[10px] text-subtle font-medium mr-1">Starters:</span>
            {starterQuestions.slice(0, 4).map((q) => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                disabled={loading}
                className="px-2 py-1 text-[10px] rounded-full bg-raised hover:bg-canvas border border-divider text-muted hover:text-ink transition-colors disabled:opacity-40"
              >
                {truncate(q, 32)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Composer */}
      <div className="shrink-0 px-4 py-3 border-t border-edge bg-canvas/40">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={`Ask about ${lead.name.split(" ")[0]}'s requirements, objections...`}
              disabled={loading}
              className="w-full pl-3 pr-8 py-2 text-xs bg-panel border border-edge rounded-md
                placeholder:text-subtle text-ink
                focus:outline-none focus:border-brand dark:focus:border-accent focus:ring-1 focus:ring-brand/20 dark:focus:ring-accent/20
                disabled:opacity-50 transition-colors"
            />
            {lastFailedMessage && (
              <span
                className="absolute right-2.5 top-2.5 text-danger"
                title="Previous request failed; click retry or send"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="w-8 h-8 flex items-center justify-center rounded-md bg-accent text-accent-fg
              hover:opacity-90 disabled:opacity-30 transition-all shrink-0 cursor-pointer disabled:cursor-not-allowed"
            aria-label="Send question to sales coach"
            title="Send (Enter)"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
        <p className="mt-1 text-[10px] text-subtle">
          Press <kbd className="font-mono text-[9px] bg-raised px-1 py-0.5 rounded border border-divider">Enter</kbd> to ask. Advice strictly grounded in {lead.name}&apos;s profile.
        </p>
      </div>
    </div>
  );
}
