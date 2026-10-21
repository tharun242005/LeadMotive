"use client";

import { useState, type FormEvent } from "react";
import { Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface InquiryFormProps {
  propertyName: string;
  propertySlug: string;
}

interface FormState {
  status: "idle" | "submitting" | "success" | "error";
  errors: Record<string, string>;
  errorMessage?: string;
}

export default function InquiryForm({
  propertyName,
  propertySlug,
}: InquiryFormProps) {
  const [formState, setFormState] = useState<FormState>({
    status: "idle",
    errors: {},
  });
  const [consent, setConsent] = useState(false);

  function validate(formData: FormData): Record<string, string> {
    const errors: Record<string, string> = {};
    const name = (formData.get("fullName") as string)?.trim();
    const email = (formData.get("email") as string)?.trim();

    if (!name) errors.fullName = "Full name is required";
    if (!email) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address";
    }
    if (!consent) errors.consent = "You must consent to continue";

    return errors;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const errors = validate(formData);

    if (Object.keys(errors).length > 0) {
      setFormState({ status: "idle", errors });
      return;
    }

    setFormState({ status: "submitting", errors: {} });

    // Simulate API call (Phase 3 will connect to real API)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setFormState({ status: "success", errors: {} });
    } catch {
      setFormState({
        status: "error",
        errors: {},
        errorMessage: "Something went wrong. Please try again.",
      });
    }
  }

  if (formState.status === "success") {
    return (
      <section
        aria-label="Inquiry submitted"
        className="animate-scale-in"
        id="inquiry-form"
      >
        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[oklch(0.62_0.18_145_/_0.12)] flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-[oklch(0.45_0.14_145)]" />
          </div>
          <h3 className="text-xl font-bold mb-2">Inquiry Submitted!</h3>
          <p className="text-[var(--foreground-muted)] text-sm max-w-md mx-auto mb-4">
            Check your email for a private conversation link about{" "}
            <strong>{propertyName}</strong>. You&apos;ll be able to ask
            questions and schedule a site visit.
          </p>
          <p className="text-xs text-[var(--foreground-subtle)]">
            This is a demonstration — no actual email will be sent.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Enquire now" className="animate-fade-up" id="inquiry-form">
      <h2 className="text-xl font-bold mb-4">Enquire Now</h2>

      <div className="card p-6 sm:p-8">
        {formState.status === "error" && (
          <div
            className="flex items-center gap-3 p-4 rounded-lg bg-[oklch(0.58_0.22_25_/_0.08)] border border-[oklch(0.58_0.22_25_/_0.2)] mb-6"
            role="alert"
          >
            <AlertCircle className="w-5 h-5 text-[oklch(0.48_0.18_25)] flex-shrink-0" />
            <p className="text-sm text-[oklch(0.48_0.18_25)]">
              {formState.errorMessage}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
            {/* Full name */}
            <div>
              <label
                htmlFor="inquiry-fullName"
                className="block text-sm font-medium mb-1.5"
              >
                Full Name <span className="text-[oklch(0.58_0.22_25)]">*</span>
              </label>
              <input
                id="inquiry-fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                className={`input ${
                  formState.errors.fullName ? "input-error" : ""
                }`}
                placeholder="e.g., Rajesh Kumar"
                aria-invalid={!!formState.errors.fullName}
                aria-describedby={
                  formState.errors.fullName ? "error-fullName" : undefined
                }
              />
              {formState.errors.fullName && (
                <p
                  id="error-fullName"
                  className="text-xs text-[oklch(0.48_0.18_25)] mt-1.5"
                  role="alert"
                >
                  {formState.errors.fullName}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="inquiry-email"
                className="block text-sm font-medium mb-1.5"
              >
                Email <span className="text-[oklch(0.58_0.22_25)]">*</span>
              </label>
              <input
                id="inquiry-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`input ${
                  formState.errors.email ? "input-error" : ""
                }`}
                placeholder="e.g., rajesh@example.com"
                aria-invalid={!!formState.errors.email}
                aria-describedby={
                  formState.errors.email ? "error-email" : undefined
                }
              />
              {formState.errors.email && (
                <p
                  id="error-email"
                  className="text-xs text-[oklch(0.48_0.18_25)] mt-1.5"
                  role="alert"
                >
                  {formState.errors.email}
                </p>
              )}
            </div>
          </div>

          {/* Contact number */}
          <div className="mb-5">
            <label
              htmlFor="inquiry-phone"
              className="block text-sm font-medium mb-1.5"
            >
              Contact Number{" "}
              <span className="text-[var(--foreground-subtle)]">
                (optional)
              </span>
            </label>
            <input
              id="inquiry-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              className="input"
              placeholder="e.g., +91 98765 43210"
            />
          </div>

          {/* Message */}
          <div className="mb-5">
            <label
              htmlFor="inquiry-message"
              className="block text-sm font-medium mb-1.5"
            >
              Message{" "}
              <span className="text-[var(--foreground-subtle)]">
                (optional)
              </span>
            </label>
            <textarea
              id="inquiry-message"
              name="message"
              rows={3}
              className="input resize-none"
              placeholder="Tell us about your requirements…"
            />
          </div>

          {/* Consent */}
          <div className="mb-6">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-[var(--border-color)] accent-[oklch(0.58_0.16_70)]"
                aria-describedby={
                  formState.errors.consent ? "error-consent" : undefined
                }
              />
              <span className="text-sm text-[var(--foreground-muted)] leading-relaxed">
                By submitting, you consent to IQOL Demo storing your name and
                email to facilitate a property conversation. This is a
                demonstration — all property data is synthetic.{" "}
                <span className="text-[oklch(0.58_0.22_25)]">*</span>
              </span>
            </label>
            {formState.errors.consent && (
              <p
                id="error-consent"
                className="text-xs text-[oklch(0.48_0.18_25)] mt-1.5 ml-7"
                role="alert"
              >
                {formState.errors.consent}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={formState.status === "submitting"}
            className="btn btn-primary btn-lg w-full sm:w-auto"
            id="inquiry-submit"
          >
            {formState.status === "submitting" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Inquiry
              </>
            )}
          </button>
        </form>
      </div>
    </section>
  );
}
