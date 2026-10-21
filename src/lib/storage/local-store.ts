// ============================================================================
// SignalDesk — Browser localStorage Persistence
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

const STORAGE_KEY = "signaldesk_leads_v1";
const PLANS_STORAGE_KEY = "signaldesk_momentum_plans_v1";
const REHEARSALS_STORAGE_KEY = "signaldesk_rehearsals_v1";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isLocalStorageAvailable(): boolean {
  try {
    const testKey = "__signaldesk_test__";
    localStorage.setItem(testKey, "1");
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

function isValidLead(obj: unknown): obj is Lead {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.name === "string" &&
    typeof o.location === "string" &&
    typeof o.customerMessage === "string" &&
    typeof o.createdAt === "string"
  );
}

function isValidPlan(obj: unknown): obj is LeadMomentumPlan {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.planId === "string" &&
    typeof o.leadId === "string" &&
    Array.isArray(o.steps)
  );
}

// ---------------------------------------------------------------------------
// Public API — Leads
// ---------------------------------------------------------------------------

/**
 * Load all leads from localStorage.
 * Returns the seed set on first visit or if storage is unavailable.
 */
export function loadLeads(): Lead[] {
  if (!isLocalStorageAvailable()) {
    return [...SEED_LEADS];
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // First visit — seed and persist
      saveLeads(SEED_LEADS);
      return [...SEED_LEADS];
    }

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.warn("[SignalDesk] Invalid storage format, re-seeding.");
      saveLeads(SEED_LEADS);
      return [...SEED_LEADS];
    }

    // Validate each record, drop corrupted ones
    const valid = parsed.filter(isValidLead);
    if (valid.length === 0) {
      console.warn("[SignalDesk] No valid leads in storage, re-seeding.");
      saveLeads(SEED_LEADS);
      return [...SEED_LEADS];
    }

    return valid;
  } catch (err) {
    console.error("[SignalDesk] Failed to parse stored leads:", err);
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
    console.error("[SignalDesk] Failed to save leads:", err);
  }
}

/**
 * Save a single lead — adds if new, replaces if existing.
 */
export function saveLead(lead: Lead): Lead[] {
  const leads = loadLeads();
  const index = leads.findIndex((l) => l.id === lead.id);
  if (index >= 0) {
    leads[index] = lead;
  } else {
    leads.unshift(lead); // Newest first
  }
  saveLeads(leads);
  return leads;
}

/**
 * Delete a lead by ID and clean up associated plan.
 */
export function deleteLead(id: string): Lead[] {
  const leads = loadLeads().filter((l) => l.id !== id);
  saveLeads(leads);
  deletePlanForLead(id);
  deleteRehearsalSessionForLead(id);
  return leads;
}

/**
 * Reset to seed data — deliberate demo reset operation.
 */
export function resetToSeedData(): Lead[] {
  saveLeads(SEED_LEADS);
  savePlans(SEEDED_MOMENTUM_PLANS);
  if (isLocalStorageAvailable()) {
    try {
      localStorage.removeItem(REHEARSALS_STORAGE_KEY);
    } catch {}
  }
  return [...SEED_LEADS];
}

/**
 * Check if leads have been loaded before (not first visit).
 */
export function hasExistingData(): boolean {
  if (!isLocalStorageAvailable()) return false;
  // Cleanup any legacy key entry if present
  try {
    localStorage.removeItem("signaldesk_gemini_api_key_v1");
  } catch {}
  return localStorage.getItem(STORAGE_KEY) !== null;
}

// ---------------------------------------------------------------------------
// Public API — Lead Momentum Plans
// ---------------------------------------------------------------------------

/**
 * Load all momentum plans from localStorage.
 * Defaults to seeded canonical plans on first access.
 */
export function loadPlans(): Record<string, LeadMomentumPlan> {
  if (!isLocalStorageAvailable()) {
    return { ...SEEDED_MOMENTUM_PLANS };
  }

  try {
    const raw = localStorage.getItem(PLANS_STORAGE_KEY);
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
    console.error("[SignalDesk] Failed to parse stored momentum plans:", err);
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
    console.error("[SignalDesk] Failed to save momentum plans:", err);
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
 * Save or update a single lead's momentum plan.
 */
export function savePlan(plan: LeadMomentumPlan): void {
  const plans = loadPlans();
  plans[plan.leadId] = plan;
  savePlans(plans);
}

/**
 * Delete a lead's momentum plan.
 */
export function deletePlanForLead(leadId: string): void {
  const plans = loadPlans();
  if (plans[leadId]) {
    delete plans[leadId];
    savePlans(plans);
  }
}

/**
 * Update the status of a specific step in a plan.
 */
export function updateStepStatus(
  leadId: string,
  stepId: string,
  status: StepStatus,
  blockedReason?: string
): LeadMomentumPlan | null {
  const plan = loadPlanForLead(leadId);
  if (!plan) return null;

  const now = new Date().toISOString();
  const updatedSteps = plan.steps.map((step) => {
    if (step.id !== stepId) return step;
    return {
      ...step,
      status,
      blockedReason: status === "blocked" ? blockedReason || "Blocked by external dependency" : undefined,
      completedAt: status === "completed" ? now : step.completedAt,
      statusUpdatedAt: now,
    };
  });

  const updatedPlan: LeadMomentumPlan = {
    ...plan,
    steps: updatedSteps,
    updatedAt: now,
  };

  savePlan(updatedPlan);
  return updatedPlan;
}

// ---------------------------------------------------------------------------
// Public API — Objection Rehearsal Sessions
// ---------------------------------------------------------------------------

/**
 * Load all objection rehearsal sessions from localStorage.
 */
export function loadRehearsalSessions(): Record<string, RehearsalSession> {
  if (!isLocalStorageAvailable()) return {};
  try {
    const raw = localStorage.getItem(REHEARSALS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (err) {
    console.error("[SignalDesk] Failed to parse rehearsal sessions:", err);
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
    console.error("[SignalDesk] Failed to save rehearsal session:", err);
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
    console.error("[SignalDesk] Failed to delete rehearsal session:", err);
  }
}

