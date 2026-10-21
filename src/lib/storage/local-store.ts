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

import type { Lead } from "@/types/lead";
import { SEED_LEADS } from "@/lib/leads/fixtures";

const STORAGE_KEY = "signaldesk_leads_v1";

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

// ---------------------------------------------------------------------------
// Public API
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
 * Delete a lead by ID.
 */
export function deleteLead(id: string): Lead[] {
  const leads = loadLeads().filter((l) => l.id !== id);
  saveLeads(leads);
  return leads;
}

/**
 * Reset to seed data — deliberate demo reset operation.
 */
export function resetToSeedData(): Lead[] {
  saveLeads(SEED_LEADS);
  return [...SEED_LEADS];
}

/**
 * Check if leads have been loaded before (not first visit).
 */
export function hasExistingData(): boolean {
  if (!isLocalStorageAvailable()) return false;
  return localStorage.getItem(STORAGE_KEY) !== null;
}
