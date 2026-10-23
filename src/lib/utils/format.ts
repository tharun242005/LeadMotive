// ============================================================================
// LeadMotive — INR & Date Formatting Utilities
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

/**
 * Robust Budget parser: handles "85L", "1.2Cr", "85,00,000", ranges "2.0-2.5 Cr", "65-80L"
 * Rejects negative budgets and min > max conditions with helpful error messages.
 */
export function parseSingleBudget(part: string, fallbackMultiplier?: number): number {
  const s = part.trim().replace(/,/g, "").replace(/₹/g, "");
  if (!s) return NaN;

  if (s.startsWith("-")) return -1;

  const crMatch = s.match(/^([\d.]+)\s*cr(ore)?$/i);
  if (crMatch) return parseFloat(crMatch[1]) * 1_00_00_000;

  const lMatch = s.match(/^([\d.]+)\s*(l|lakh|lac|lacs)$/i);
  if (lMatch) return parseFloat(lMatch[1]) * 1_00_000;

  const num = parseFloat(s);
  if (isNaN(num)) return NaN;

  if (fallbackMultiplier && !isNaN(fallbackMultiplier)) {
    return num * fallbackMultiplier;
  }
  return num;
}

export function parseBudgetWithValidation(raw: string): { value: number; error?: string } {
  const s = raw.trim();
  if (!s) return { value: 0 };

  if (s.includes("-") && !s.includes("–") && s.trim().startsWith("-")) {
    return { value: NaN, error: "Budget cannot be negative" };
  }

  // Handle ranges like "2.0-2.5 Cr", "2.0 – 2.5 Crore", "90L - 1.1Cr", "1.5 Cr to 1 Cr"
  const rangeSplit = s.split(/–|-|\bto\b/i);
  if (rangeSplit.length === 2) {
    const rawMin = rangeSplit[0].trim();
    const rawMax = rangeSplit[1].trim();

    // Check if max has a unit (cr or lakh) that min should inherit
    let fallbackUnit: number | undefined;
    if (/cr(ore)?/i.test(rawMax)) fallbackUnit = 1_00_00_000;
    else if (/(l|lakh|lac|lacs)/i.test(rawMax)) fallbackUnit = 1_00_000;

    const min = parseSingleBudget(rawMin, fallbackUnit);
    const max = parseSingleBudget(rawMax);

    if (isNaN(min) || isNaN(max)) {
      return { value: NaN, error: "Enter a valid budget range (e.g. 2.0–2.5 Cr or 65–80L)" };
    }
    if (min < 0 || max < 0) {
      return { value: NaN, error: "Budget cannot be negative" };
    }
    if (min > max) {
      return { value: NaN, error: "Minimum budget cannot exceed maximum budget" };
    }
    // For range, store upper bound as maximum target budget
    return { value: max };
  }

  const single = parseSingleBudget(s);
  if (isNaN(single)) {
    return { value: NaN, error: "Enter a valid number (e.g. 85,00,000, 85L, or 1.2Cr)" };
  }
  if (single < 0) {
    return { value: NaN, error: "Budget cannot be negative" };
  }

  return { value: single };
}
