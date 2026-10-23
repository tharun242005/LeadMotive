"use client";

import { useState } from "react";
import { X, Sparkles, Target, MessageSquare, Mail, Phone, Compass, RefreshCw } from "lucide-react";
import type { Lead, PlanningObjective, CommunicationFormat, LeadMomentumPlan } from "@/types/lead";
import { formatINR, formatTimeline } from "@/lib/utils/format";

interface PlanObjectiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  onSubmit: (params: {
    objective: PlanningObjective;
    communicationFormat: CommunicationFormat;
    additionalInstructions?: string;
    isAdaptation?: boolean;
    adaptationReason?: string;
  }) => void;
  isGenerating: boolean;
  existingPlan?: LeadMomentumPlan | null;
  isAdaptationMode?: boolean;
}

const OBJECTIVE_OPTIONS: Array<{
  id: PlanningObjective;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: "progress_buyer",
    label: "Progress towards next step",
    description: "Accelerate site visit, property tour, or commercial proposal for an engaged lead.",
    icon: Target,
  },
  {
    id: "address_objection",
    label: "Address specific objection",
    description: "Target financing, pricing, construction progress, or location hesitations.",
    icon: Compass,
  },
  {
    id: "first_follow_up",
    label: "Make first meaningful follow-up",
    description: "Establish strong rapport with fresh inquiries through high-value evidence.",
    icon: MessageSquare,
  },
  {
    id: "clarify_requirements",
    label: "Clarify requirements & readiness",
    description: "Qualify unknown budget, timeline, configuration, or decision-makers.",
    icon: Sparkles,
  },
  {
    id: "re_engage_dormant",
    label: "Re-engage a dormant lead",
    description: "Respectful re-engagement with value hook and clear stopping condition.",
    icon: RefreshCw,
  },
  {
    id: "complete_strategy",
    label: "Complete progression strategy",
    description: "Full end-to-end plan from initial qualification to unit reservation.",
    icon: Compass,
  },
  {
    id: "custom",
    label: "Custom objective",
    description: "Provide your own custom goal in the instructions below.",
    icon: Sparkles,
  },
];

const FORMAT_OPTIONS: Array<{
  id: CommunicationFormat;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "whatsapp", label: "WhatsApp Draft", icon: MessageSquare },
  { id: "call_script", label: "Phone Call Script", icon: Phone },
  { id: "email", label: "Email Draft", icon: Mail },
  { id: "general_action", label: "General Guidance", icon: Compass },
];

export function PlanObjectiveModal({
  isOpen,
  onClose,
  lead,
  onSubmit,
  isGenerating,
  existingPlan,
  isAdaptationMode = false,
}: PlanObjectiveModalProps) {
  const [selectedObjective, setSelectedObjective] = useState<PlanningObjective>(
    existingPlan?.objective || "progress_buyer"
  );
  const [selectedFormat, setSelectedFormat] = useState<CommunicationFormat>(
    existingPlan?.communicationFormat || "whatsapp"
  );
  const [additionalInstructions, setAdditionalInstructions] = useState(
    existingPlan?.additionalInstructions || ""
  );
  const [adaptationReason, setAdaptationReason] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      objective: selectedObjective,
      communicationFormat: selectedFormat,
      additionalInstructions: additionalInstructions.trim() || undefined,
      isAdaptation: isAdaptationMode,
      adaptationReason: isAdaptationMode ? adaptationReason.trim() : undefined,
    });
  };

  const completedCount = existingPlan?.steps.filter((s) => s.status === "completed").length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs anim-fade-in">
      <div
        className="w-full max-w-xl bg-panel border border-edge rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-edge flex items-center justify-between bg-raised/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-brand-fg">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-ink">
                {isAdaptationMode ? "Adapt Remaining Steps" : "Generate Lead Momentum Plan"}
              </h2>
              <p className="text-xs text-muted">
                {isAdaptationMode
                  ? `Preserve ${completedCount} completed step(s) & adjust future actions`
                  : `Personalized sequence for ${lead.name}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="w-8 h-8 flex items-center justify-center rounded-md text-muted hover:text-ink hover:bg-raised transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Lead Context Pill */}
        <div className="px-6 py-3 bg-canvas/60 border-b border-divider flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
          <span className="font-semibold text-ink">{lead.name}</span>
          <span>•</span>
          <span>{lead.location}</span>
          <span>•</span>
          <span>{lead.propertyRequirement}</span>
          <span>•</span>
          <span>{lead.budget > 0 ? formatINR(lead.budget) : "Budget undisclosed"}</span>
          <span>•</span>
          <span>{formatTimeline(lead.buyingTimeline)}</span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Adaptation explanation if adapting */}
          {isAdaptationMode && (
            <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg">
              <label className="block text-xs font-semibold text-ink mb-1">
                What changed or what did the customer say? <span className="text-danger">*</span>
              </label>
              <textarea
                value={adaptationReason}
                onChange={(e) => setAdaptationReason(e.target.value)}
                placeholder="e.g. Customer asked to postpone visit by 1 week, or budget reduced to ₹55L, or asked about bank loan pre-approval..."
                rows={2}
                required
                className="w-full px-3 py-2 text-xs bg-canvas text-ink border border-edge rounded-md focus:outline-hidden focus:ring-1 focus:ring-accent"
              />
              <p className="mt-1 text-[11px] text-muted">
                Completed steps ({completedCount}) will remain untouched. Only pending steps will be adapted.
              </p>
            </div>
          )}

          {/* Planning Objective */}
          <div>
            <label className="block text-xs font-semibold text-subtle uppercase tracking-wider mb-2">
              Select Planning Objective
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {OBJECTIVE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedObjective === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedObjective(opt.id)}
                    className={`p-3 rounded-lg border text-left transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? "border-accent bg-accent/5 ring-1 ring-accent"
                        : "border-edge bg-canvas hover:border-muted/40"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected ? "bg-accent text-accent-fg" : "bg-raised text-muted"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-ink leading-tight">{opt.label}</p>
                      <p className="text-[11px] text-muted leading-snug mt-0.5 line-clamp-2">
                        {opt.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preferred Communication Format */}
          <div>
            <label className="block text-xs font-semibold text-subtle uppercase tracking-wider mb-2">
              Preferred Draft Format
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {FORMAT_OPTIONS.map((fmt) => {
                const Icon = fmt.icon;
                const isSelected = selectedFormat === fmt.id;
                return (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setSelectedFormat(fmt.id)}
                    className={`p-2.5 rounded-lg border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                      isSelected
                        ? "border-accent bg-accent/5 ring-1 ring-accent"
                        : "border-edge bg-canvas hover:border-muted/40"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? "text-accent" : "text-muted"}`} />
                    <span className="text-xs font-medium text-ink">{fmt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Additional Instructions */}
          <div>
            <label className="block text-xs font-semibold text-subtle uppercase tracking-wider mb-1">
              Additional Salesperson Guidance (Optional)
            </label>
            <textarea
              value={additionalInstructions}
              onChange={(e) => setAdditionalInstructions(e.target.value)}
              placeholder="e.g. Focus on school distance; do not recommend property visit until loan pre-approval is verified..."
              rows={2}
              className="w-full px-3 py-2 text-xs bg-canvas text-ink border border-edge rounded-md focus:outline-hidden focus:ring-1 focus:ring-accent"
            />
          </div>

          {/* Footer CTAs */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-edge">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="px-4 py-2 text-xs font-medium text-muted hover:text-ink hover:bg-raised rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating || (isAdaptationMode && !adaptationReason.trim())}
              className="px-5 py-2 text-xs font-semibold bg-brand text-brand-fg rounded-md hover:opacity-90 transition-opacity flex items-center gap-2 shadow-xs disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-brand-fg border-t-transparent rounded-full animate-spin" />
                  <span>{isAdaptationMode ? "Adapting Plan..." : "Generating Strategy..."}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isAdaptationMode ? "Adapt Remaining Steps" : "Generate Momentum Plan"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
