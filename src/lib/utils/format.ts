// ============================================================================
// SignalDesk — INR & Date Formatting Utilities
// ============================================================================

/**
 * Format a number as INR with lakh/crore conventions.
 * Examples:
 *   4500000   → "₹45 L"
 *   15000000  → "₹1.5 Cr"
 *   150000000 → "₹15 Cr"
 *   800000    → "₹8 L"
 */
export function formatINR(amount: number): string {
  if (amount <= 0) return "Not specified";

  if (amount >= 1_00_00_000) {
    const crores = amount / 1_00_00_000;
    const display = crores % 1 === 0 ? crores.toFixed(0) : crores.toFixed(1);
    return `₹${display} Cr`;
  }

  if (amount >= 1_00_000) {
    const lakhs = amount / 1_00_000;
    const display = lakhs % 1 === 0 ? lakhs.toFixed(0) : lakhs.toFixed(1);
    return `₹${display} L`;
  }

  return `₹${amount.toLocaleString("en-IN")}`;
}

/**
 * Format a buying timeline enum into a human-readable string.
 */
export function formatTimeline(timeline: string): string {
  const map: Record<string, string> = {
    immediate: "Immediately",
    "1_to_3_months": "1–3 months",
    "3_to_6_months": "3–6 months",
    "6_to_12_months": "6–12 months",
    beyond_12_months: "12+ months",
    not_specified: "Not specified",
  };
  return map[timeline] ?? timeline;
}

/**
 * Format an ISO timestamp into a relative or short date string.
 */
export function formatRelativeDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

/**
 * Generate a stable unique ID (for leads and messages).
 * Uses crypto.randomUUID when available, falls back to a simple generator.
 */
export function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Truncate text to a maximum length, adding ellipsis if needed.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1).trimEnd() + "…";
}

/**
 * Capitalise the first letter of a string.
 */
export function capitalise(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}
