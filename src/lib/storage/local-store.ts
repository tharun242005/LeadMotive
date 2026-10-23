// ============================================================================
// LeadMotive — Browser localStorage Persistence
// ============================================================================
//
// All lead data lives in the browser. This module provides:
// - Versioned storage keys (migration-safe)
// - Safe JSON parsing with error recovery
// - Validation of loaded records
// - Seed initialisation on first visit
// - Demo reset operation
//
// IMPORTANT:
// - Never access `window` or `localStorage` during server rendering.
// - Always call these functions inside useEffect or event handlers.
// - Stored leads belong to this browser only — not shared across devices.
// ============================================================================

import type { Lead, LeadMomentumPlan, StepStatus, RehearsalSession } from "@/types/lead";
import { SEED_LEADS } from "@/lib/leads/fixtures";
import { SEEDED_MOMENTUM_PLANS } from "@/lib/leads/momentum-fixtures";
import { normalizeAssistantPriorityText, bandFromScore, computePriority } from "@/lib/leads/scoring";

const STORAGE_KEY = "leadmotive_leads_v1";
const LEGACY_STORAGE_KEY = "signaldesk_leads_v1";

const PLANS_STORAGE_KEY = "leadmotive_momentum_plans_v1";
const LEGACY_PLANS_STORAGE_KEY = "signaldesk_momentum_plans_v1";

const REHEARSALS_STORAGE_KEY = "leadmotive_rehearsals_v1";
const LEGACY_REHEARSALS_STORAGE_KEY = "signaldesk_rehearsals_v1";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isLocalStorageAvailable(): boolean {
  try {
    const testKey = "__leadmotive_test__";
    localStorage.setItem(testKey, "1");
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate that a parsed object conforms to minimal Lead shape.
 * Protects against corrupted storage entries.
 */
function isValidLead(item: unknown): item is Lead {
  if (!item || typeof item !== "object") return false;
  const cand = item as Record<string, unknown>;
  return (
    typeof cand.id === "string" &&
    typeof cand.name === "string" &&
    typeof cand.location === "string" &&
    typeof cand.propertyRequirement === "string" &&
    typeof cand.budget === "number" &&
    typeof cand.buyingTimeline === "string" &&
    typeof cand.customerMessage === "string" &&
    typeof cand.createdAt === "string" &&
    typeof cand.updatedAt === "string" &&
    cand.priority !== undefined &&
    typeof (cand.priority as Record<string, unknown>).total === "number" &&
    typeof (cand.priority as Record<string, unknown>).band === "string"
  );
}

function isValidPlan(item: unknown): item is LeadMomentumPlan {
  if (!item || typeof item !== "object") return false;
  const cand = item as Record<string, unknown>;
  return (
    typeof cand.leadId === "string" &&
    typeof cand.planTitle === "string" &&
    typeof cand.version === "number" &&
    Array.isArray(cand.steps)
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Load leads from localStorage. If no leads are stored, initialises
 * storage with the synthetic seed leads and returns them.
 */
export function loadLeads(): Lead[] {
  if (!isLocalStorageAvailable()) {
    return [...SEED_LEADS];
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) {
      // First visit — seed and persist
      saveLeads(SEED_LEADS);
      return [...SEED_LEADS];
    }

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.warn("[LeadMotive] Invalid storage format, re-seeding.");
      saveLeads(SEED_LEADS);
      return [...SEED_LEADS];
    }

    // Validate each record, drop corrupted ones
    const valid = parsed.filter(isValidLead);
    if (valid.length === 0) {
      console.warn("[LeadMotive] No valid leads in storage, re-seeding.");
      saveLeads(SEED_LEADS);
      return [...SEED_LEADS];
    }

    // Safely migrate any legacy assistant copilot messages
    let hasLegacyAssistantText = false;
    const migrated = valid.map((l) => {
      if (!Array.isArray(l.copilotMessages) || l.copilotMessages.length === 0) return l;
      let changed = false;
      const updatedMessages = l.copilotMessages.map((m) => {
        if (m.role !== "assistant") return m;
        const normalized = normalizeAssistantPriorityText(m.content);
        const normEvidence = m.supportingEvidence?.map(normalizeAssistantPriorityText);
        if (normalized !== m.content) changed = true;
        return {
          ...m,
          content: normalized,
          supportingEvidence: normEvidence,
        };
      });
      if (changed) hasLegacyAssistantText = true;
      return changed ? { ...l, copilotMessages: updatedMessages } : l;
    });

    // Ensure priority.band is always consistent with the authoritative 4-factor scoring thresholds
    let hasMismatchedBands = false;
    let hasLegacyFactors = false;
    const aligned = migrated.map((l) => {
      // Check if lead has legacy 5-factor structure (e.g. factors named budget, message, etc.)
      const isLegacy5Factor = l.priority?.factors?.some((f) => f.name === "budget" || f.name === "message");
      if (isLegacy5Factor) {
        hasLegacyFactors = true;
        const newPriority = computePriority({
          budget: l.budget,
          buyingTimeline: l.buyingTimeline,
          customerMessage: l.customerMessage,
          location: l.location,
          propertyRequirement: l.propertyRequirement,
        });
        return {
          ...l,
          priority: newPriority,
        };
      }

      if (l.priority && typeof l.priority.total === "number") {
        const correctBand = bandFromScore(l.priority.total);
        if (l.priority.band !== correctBand) {
          hasMismatchedBands = true;
          return {
            ...l,
            priority: {
              ...l.priority,
              band: correctBand,
            },
          };
        }
      }
      return l;
    });

    if (hasLegacyAssistantText || hasMismatchedBands || hasLegacyFactors) {
      saveLeads(aligned);
    }

    return aligned;
  } catch (err) {
    console.error("[LeadMotive] Failed to parse stored leads:", err);
    saveLeads(SEED_LEADS);
    return [...SEED_LEADS];
  }
}

/**
 * Save the complete lead array to localStorage.
 */
export function saveLeads(leads: Lead[]): void {
  if (!isLocalStorageAvailable()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
  } catch (err) {
    console.error("[LeadMotive] Failed to save leads:", err);
  }
}

/**
 * Save or update a single lead. Appends if new, replaces if id matches.
 */
export function saveLead(lead: Lead): Lead[] {
  const current = loadLeads();
  const idx = current.findIndex((l) => l.id === lead.id);
  const updated =
    idx >= 0
      ? current.map((l) => (l.id === lead.id ? lead : l))
      : [lead, ...current];
  saveLeads(updated);
  return updated;
}

/**
 * Delete a single lead by id.
 */
export function deleteLead(id: string): Lead[] {
  const current = loadLeads();
  const filtered = current.filter((l) => l.id !== id);
  saveLeads(filtered);
  return filtered;
}

/**
 * Reset all localStorage leads and plans back to initial synthetic seed data.
 */
export function resetToSeedData(): Lead[] {
  saveLeads(SEED_LEADS);
  savePlans(SEEDED_MOMENTUM_PLANS);
  if (isLocalStorageAvailable()) {
    try {
      localStorage.removeItem(REHEARSALS_STORAGE_KEY);
      localStorage.removeItem(LEGACY_REHEARSALS_STORAGE_KEY);
      localStorage.removeItem("leadmotive_gemini_api_key_v1");
      localStorage.removeItem("signaldesk_gemini_api_key_v1");
    } catch {
      // ignore
    }
  }
  return [...SEED_LEADS];
}

// ---------------------------------------------------------------------------
// Lead Momentum Plans Storage
// ---------------------------------------------------------------------------

/**
 * Load all momentum plans from localStorage. If empty, seeds with canonical plans.
 */
export function loadPlans(): Record<string, LeadMomentumPlan> {
  if (!isLocalStorageAvailable()) {
    return { ...SEEDED_MOMENTUM_PLANS };
  }

  try {
    const raw = localStorage.getItem(PLANS_STORAGE_KEY) || localStorage.getItem(LEGACY_PLANS_STORAGE_KEY);
    if (!raw) {
      savePlans(SEEDED_MOMENTUM_PLANS);
      return { ...SEEDED_MOMENTUM_PLANS };
    }

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") {
      savePlans(SEEDED_MOMENTUM_PLANS);
      return { ...SEEDED_MOMENTUM_PLANS };
    }

    const validPlans: Record<string, LeadMomentumPlan> = {};
    for (const [leadId, plan] of Object.entries(parsed)) {
      if (isValidPlan(plan)) {
        validPlans[leadId] = plan;
      }
    }

    return validPlans;
  } catch (err) {
    console.error("[LeadMotive] Failed to parse stored momentum plans:", err);
    savePlans(SEEDED_MOMENTUM_PLANS);
    return { ...SEEDED_MOMENTUM_PLANS };
  }
}

/**
 * Save all plans map.
 */
export function savePlans(plans: Record<string, LeadMomentumPlan>): void {
  if (!isLocalStorageAvailable()) return;
  try {
    localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(plans));
  } catch (err) {
    console.error("[LeadMotive] Failed to save momentum plans:", err);
  }
}

/**
 * Load a specific plan for a lead.
 */
export function loadPlanForLead(leadId: string): LeadMomentumPlan | null {
  const plans = loadPlans();
  return plans[leadId] || null;
}

/**
 * Save or update a single lead momentum plan.
 */
export function savePlan(plan: LeadMomentumPlan): void {
  const plans = loadPlans();
  plans[plan.leadId] = plan;
  savePlans(plans);
}

/**
 * Update step execution status within a plan.
 */
export function updateStepStatus(
  leadId: string,
  stepId: string,
  status: StepStatus,
  blockedReason?: string
): LeadMomentumPlan | null {
  const plan = loadPlanForLead(leadId);
  if (!plan) return null;

  const nowIso = new Date().toISOString();

  const updatedSteps = plan.steps.map((step) => {
    if (step.id !== stepId) return step;

    const isNowCompleted = status === "completed";
    return {
      ...step,
      status,
      completedAt: isNowCompleted ? nowIso : undefined,
      blockedReason: status === "blocked" ? blockedReason : undefined,
    };
  });

  const updatedPlan: LeadMomentumPlan = {
    ...plan,
    steps: updatedSteps,
    updatedAt: nowIso,
  };

  savePlan(updatedPlan);
  return updatedPlan;
}

// ---------------------------------------------------------------------------
// Objection Rehearsal Sessions Storage
// ---------------------------------------------------------------------------

/**
 * Load all objection rehearsal sessions from localStorage.
 */
export function loadRehearsalSessions(): Record<string, RehearsalSession> {
  if (!isLocalStorageAvailable()) return {};
  try {
    const raw = localStorage.getItem(REHEARSALS_STORAGE_KEY) || localStorage.getItem(LEGACY_REHEARSALS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (err) {
    console.error("[LeadMotive] Failed to parse rehearsal sessions:", err);
    return {};
  }
}

/**
 * Load rehearsal session for a specific lead.
 */
export function loadRehearsalSessionForLead(leadId: string): RehearsalSession | null {
  const sessions = loadRehearsalSessions();
  return sessions[leadId] || null;
}

/**
 * Save a rehearsal session record for a lead.
 */
export function saveRehearsalSession(session: RehearsalSession): void {
  if (!isLocalStorageAvailable()) return;
  try {
    const sessions = loadRehearsalSessions();
    sessions[session.leadId] = session;
    localStorage.setItem(REHEARSALS_STORAGE_KEY, JSON.stringify(sessions));
  } catch (err) {
    console.error("[LeadMotive] Failed to save rehearsal session:", err);
  }
}

/**
 * Delete a rehearsal session for a specific lead.
 */
export function deleteRehearsalSessionForLead(leadId: string): void {
  if (!isLocalStorageAvailable()) return;
  try {
    const sessions = loadRehearsalSessions();
    if (sessions[leadId]) {
      delete sessions[leadId];
      localStorage.setItem(REHEARSALS_STORAGE_KEY, JSON.stringify(sessions));
    }
  } catch (err) {
    console.error("[LeadMotive] Failed to delete rehearsal session:", err);
  }
}
