"use client";

import { useState, useCallback } from "react";
import { X, Loader2 } from "lucide-react";
import type { Lead, BuyingTimeline } from "@/types/lead";
import { computePriority } from "@/lib/leads/scoring";
import { generateId } from "@/lib/utils/format";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface LeadIntakeFormProps {
  onSubmit: (lead: Lead) => void;
  onClose: () => void;
}

interface FormData {
  name: string;
  location: string;
  propertyRequirement: string;
  budget: string;
  buyingTimeline: BuyingTimeline;
  customerMessage: string;
}

interface FormErrors {
  name?: string;
  location?: string;
  propertyRequirement?: string;
  budget?: string;
  customerMessage?: string;
}

const TIMELINE_OPTIONS: Array<{ value: BuyingTimeline; label: string }> = [
  { value: "immediate", label: "Immediately (within 1 month)" },
  { value: "1_to_3_months", label: "1–3 months" },
  { value: "3_to_6_months", label: "3–6 months" },
  { value: "6_to_12_months", label: "6–12 months" },
  { value: "beyond_12_months", label: "12+ months" },
  { value: "not_specified", label: "Not specified" },
];

const INITIAL: FormData = {
  name: "",
  location: "",
  propertyRequirement: "",
  budget: "",
  buyingTimeline: "not_specified",
  customerMessage: "",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function LeadIntakeForm({ onSubmit, onClose }: LeadIntakeFormProps) {
  const [data, setData] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const set = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) => {
      setData((d) => ({ ...d, [key]: value }));
      setErrors((e) => ({ ...e, [key]: undefined }));
    },
    [],
  );

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!data.name.trim()) e.name = "Name is required";
    if (!data.location.trim()) e.location = "Location is required";
    if (!data.propertyRequirement.trim()) e.propertyRequirement = "Property requirement is required";
    if (data.budget && isNaN(parseBudget(data.budget))) e.budget = "Enter a valid number (e.g. 85,00,000 or 85L)";
    if (!data.customerMessage.trim()) e.customerMessage = "Customer message is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || submitting) return;
    setSubmitting(true);

    const budgetNum = parseBudget(data.budget) || 0;
    const now = new Date().toISOString();

    const lead: Lead = {
      id: generateId(),
      name: data.name.trim(),
      location: data.location.trim(),
      propertyRequirement: data.propertyRequirement.trim(),
      budget: budgetNum,
      buyingTimeline: data.buyingTimeline,
      customerMessage: data.customerMessage.trim(),
      createdAt: now,
      updatedAt: now,
      analysisStatus: "pending",
      analysis: null,
      priority: computePriority({
        budget: budgetNum,
        buyingTimeline: data.buyingTimeline,
        customerMessage: data.customerMessage.trim(),
        location: data.location.trim(),
        propertyRequirement: data.propertyRequirement.trim(),
      }),
      copilotMessages: [],
      rehearsalMessages: [],
    };

    onSubmit(lead);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[5vh] md:pt-[10vh] px-4 anim-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-lg bg-panel border border-edge rounded-xl shadow-lg overflow-hidden anim-scale">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-edge">
          <h2 className="text-sm font-semibold text-ink">Add New Lead</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md text-subtle hover:text-ink hover:bg-raised transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
          <Field label="Name" error={errors.name} required>
            <input
              type="text"
              value={data.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Priya Sharma"
              className="sd-input"
            />
          </Field>

          <Field label="Location (Bengaluru)" error={errors.location} required>
            <input
              type="text"
              value={data.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="e.g. Whitefield, Sarjapur Road, Hebbal"
              className="sd-input"
            />
          </Field>

          <Field label="Property Requirement" error={errors.propertyRequirement} required>
            <input
              type="text"
              value={data.propertyRequirement}
              onChange={(e) => set("propertyRequirement", e.target.value)}
              placeholder="e.g. 3 BHK apartment in a gated community"
              className="sd-input"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Budget (₹)" error={errors.budget}>
              <input
                type="text"
                value={data.budget}
                onChange={(e) => set("budget", e.target.value)}
                placeholder="e.g. 85L or 1.2Cr"
                className="sd-input"
              />
            </Field>

            <Field label="Buying Timeline">
              <select
                value={data.buyingTimeline}
                onChange={(e) => set("buyingTimeline", e.target.value as BuyingTimeline)}
                className="sd-input"
              >
                {TIMELINE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Customer Message / Transcript" error={errors.customerMessage} required>
            <textarea
              value={data.customerMessage}
              onChange={(e) => set("customerMessage", e.target.value)}
              placeholder="Paste the customer's inquiry, chat transcript, or describe what they said…"
              rows={4}
              className="sd-input resize-y min-h-[80px]"
            />
          </Field>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-muted hover:text-ink rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium bg-accent text-accent-fg rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Save Lead"
              )}
            </button>
          </div>
        </form>

        <style jsx>{`
          .sd-input {
            width: 100%;
            padding: 0.5rem 0.75rem;
            font-size: 0.875rem;
            background: var(--sd-canvas);
            border: 1px solid var(--sd-border);
            border-radius: 6px;
            color: var(--sd-text-primary);
            transition: border-color 120ms, box-shadow 120ms;
          }
          .sd-input:focus {
            outline: none;
            border-color: var(--sd-brand);
            box-shadow: 0 0 0 2px rgba(36, 75, 55, 0.12);
          }
          .sd-input::placeholder {
            color: var(--sd-text-tertiary);
          }
          .sd-input-error {
            border-color: var(--sd-error);
          }
          .sd-input-error:focus {
            box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.12);
          }
        `}</style>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Field wrapper
// ---------------------------------------------------------------------------
function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted mb-1 block">
        {label}
        {required && <span className="text-danger ml-0.5">*</span>}
      </span>
      <div className={error ? "[&>.sd-input]:border-danger" : ""}>{children}</div>
      {error && <p className="text-[11px] text-danger mt-0.5">{error}</p>}
    </label>
  );
}

// ---------------------------------------------------------------------------
// Budget parser: handles "85L", "1.2Cr", "85,00,000", "8500000"
// ---------------------------------------------------------------------------
function parseBudget(raw: string): number {
  const s = raw.trim().replace(/,/g, "").replace(/₹/g, "");
  if (!s) return 0;

  // "1.2Cr" or "1.2 cr"
  const crMatch = s.match(/^([\d.]+)\s*cr(ore)?$/i);
  if (crMatch) return parseFloat(crMatch[1]) * 1_00_00_000;

  // "85L" or "85 lakh"
  const lMatch = s.match(/^([\d.]+)\s*(l|lakh|lac|lacs)$/i);
  if (lMatch) return parseFloat(lMatch[1]) * 1_00_000;

  // Plain number
  const num = parseFloat(s);
  return isNaN(num) ? NaN : num;
}
