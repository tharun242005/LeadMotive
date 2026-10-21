// ============================================================================
// SignalDesk — AI Client (Gemini)
// ============================================================================
//
// Server-side only. The API key never reaches the browser.
// This module wraps the Google Generative AI SDK.
//
// Model: Will be verified before integration (Prompt 4).
// ============================================================================

/**
 * Placeholder — actual Gemini client will be implemented in Prompt 4
 * after verifying model availability and free-tier quotas.
 *
 * Architecture:
 * - This module runs server-side only (used by route handlers).
 * - GOOGLE_GEMINI_API_KEY is read from process.env.
 * - All responses are validated against our type schemas before returning.
 */

export const AI_MODEL = "gemini-2.0-flash";

export function getAIConfig() {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GOOGLE_GEMINI_API_KEY is not set. Add it to .env.local"
    );
  }
  return { apiKey, model: AI_MODEL };
}
