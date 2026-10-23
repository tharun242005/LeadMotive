// ============================================================================
// LeadMotive — Canonical Server-Side AI Provider & Resilience Cascade
// ============================================================================
//
// 1. Primary: Google Gemini (gemini-3.5-flash-lite)
// 2. Secondary: Groq (openai/gpt-oss-20b or configured model)
// 3. Fallback: Deterministic offline Bengaluru heuristic engine
//
// Security & Resilience Rules:
// - All keys are server-side only. Zero secrets leaked or emitted to browser.
// - Diagnostics never exposes any API key value, prefix, suffix, or masked string.
// - Rate-limit circuit breaker: When 429/quota error is hit, provider is paused
//   for a cooldown period to avoid repeated 12s hangs on every subsequent request.
// - In-flight deduplication: Prevents double-fetch storms for identical operations.
// - Zero-cost passive diagnostics for routine status checks; explicit active tests.
// ============================================================================

import { GoogleGenAI } from "@google/genai";
import type { DiagnosticsResponse } from "@/types/ai";

export const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash-lite";
export const DEFAULT_GROQ_MODEL = "openai/gpt-oss-20b";

// ---------------------------------------------------------------------------
// 1. Canonical Server Configuration
// ---------------------------------------------------------------------------

export interface ServerAIConfig {
  geminiApiKey?: string;
  geminiModel: string;
  isGeminiConfigured: boolean;

  groqApiKey?: string;
  groqModel: string;
  isGroqConfigured: boolean;

  isAnyConfigured: boolean;
}

function cleanEnvSecret(value?: string | null): string | undefined {
  if (!value) return undefined;
  // Strip whitespace, newlines, and any accidental wrapping quotes
  const cleaned = value.trim().replace(/\r?\n|\r/g, "").replace(/^["']|["']$/g, "");
  if (!cleaned || cleaned.length < 6 || cleaned === "your_api_key_here") {
    return undefined;
  }
  return cleaned;
}

export function getCanonicalAIConfig(): ServerAIConfig {
  const geminiApiKey =
    cleanEnvSecret(process.env.GEMINI_API_KEY) ||
    cleanEnvSecret(process.env.GOOGLE_GEMINI_API_KEY);

  const geminiModel =
    process.env.GEMINI_MODEL?.trim().replace(/^["']|["']$/g, "") || DEFAULT_GEMINI_MODEL;

  const groqApiKey = cleanEnvSecret(process.env.GROQ_API_KEY);

  const groqModel =
    process.env.GROQ_MODEL?.trim().replace(/^["']|["']$/g, "") || DEFAULT_GROQ_MODEL;

  const isGeminiConfigured = Boolean(geminiApiKey);
  const isGroqConfigured = Boolean(groqApiKey);

  return {
    geminiApiKey,
    geminiModel,
    isGeminiConfigured,
    groqApiKey,
    groqModel,
    isGroqConfigured,
    isAnyConfigured: isGeminiConfigured || isGroqConfigured,
  };
}

// ---------------------------------------------------------------------------
// 2. Provider Runtime Health & Circuit Breaker State
// ---------------------------------------------------------------------------

interface ProviderHealth {
  lastStatus: "ready" | "rate_limited" | "unavailable" | "unconfigured" | "error";
  lastTestedAt?: number;
  lastLatencyMs?: number;
  lastError?: string;
  rateLimitResetTime?: number; // Cooldown timestamp until when provider is skipped
  consecutiveFailures: number;
}

const geminiHealth: ProviderHealth = {
  lastStatus: "unconfigured",
  consecutiveFailures: 0,
};

const groqHealth: ProviderHealth = {
  lastStatus: "unconfigured",
  consecutiveFailures: 0,
};

export function getProviderHealthState() {
  return {
    gemini: { ...geminiHealth },
    groq: { ...groqHealth },
  };
}

export function resetProviderHealthForTesting() {
  geminiHealth.lastStatus = "unconfigured";
  geminiHealth.lastTestedAt = undefined;
  geminiHealth.lastLatencyMs = undefined;
  geminiHealth.lastError = undefined;
  geminiHealth.rateLimitResetTime = undefined;
  geminiHealth.consecutiveFailures = 0;

  groqHealth.lastStatus = "unconfigured";
  groqHealth.lastTestedAt = undefined;
  groqHealth.lastLatencyMs = undefined;
  groqHealth.lastError = undefined;
  groqHealth.rateLimitResetTime = undefined;
  groqHealth.consecutiveFailures = 0;
}

export function simulateGeminiRateLimitForTesting(msg = "429 Quota Exceeded") {
  markProviderRateLimited(geminiHealth, msg, 60_000);
}

export function simulateGroqRateLimitForTesting(msg = "429 Groq Rate Limit") {
  markProviderRateLimited(groqHealth, msg, 60_000);
}

function isProviderRateLimited(health: ProviderHealth): boolean {
  if (health.rateLimitResetTime && Date.now() < health.rateLimitResetTime) {
    return true;
  }
  return false;
}

function markProviderRateLimited(health: ProviderHealth, errorMsg: string, cooldownMs: number = 60_000) {
  health.lastStatus = "rate_limited";
  health.lastError = errorMsg;
  health.rateLimitResetTime = Date.now() + cooldownMs;
  health.consecutiveFailures++;
}

function markProviderUnavailable(health: ProviderHealth, errorMsg: string, cooldownMs: number = 15_000) {
  health.lastStatus = "unavailable";
  health.lastError = errorMsg;
  health.rateLimitResetTime = Date.now() + cooldownMs;
  health.consecutiveFailures++;
}

function markProviderSuccess(health: ProviderHealth, latencyMs: number) {
  health.lastStatus = "ready";
  health.lastTestedAt = Date.now();
  health.lastLatencyMs = latencyMs;
  health.lastError = undefined;
  health.rateLimitResetTime = undefined;
  health.consecutiveFailures = 0;
}

// ---------------------------------------------------------------------------
// 3. In-Flight Request Deduplication
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const inFlightRequests = new Map<string, Promise<any>>();

export async function deduplicateRequest<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inFlightRequests.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = fn().finally(() => {
    inFlightRequests.delete(key);
  });

  inFlightRequests.set(key, promise);
  return promise;
}

// ---------------------------------------------------------------------------
// 4. Request Timeout Helper
// ---------------------------------------------------------------------------

function withTimeout<T>(promise: Promise<T>, ms: number, timeoutMsg: string): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(timeoutMsg)), ms);
  });
  return Promise.race([
    promise.then((res) => {
      clearTimeout(timer);
      return res;
    }),
    timeoutPromise,
  ]);
}

// ---------------------------------------------------------------------------
// 5. Google Gemini Client & Caller
// ---------------------------------------------------------------------------

let genAIClient: GoogleGenAI | null = null;
let currentGeminiKey: string | null = null;

function getGenAIClient(apiKey: string): GoogleGenAI {
  if (!genAIClient || currentGeminiKey !== apiKey) {
    genAIClient = new GoogleGenAI({ apiKey });
    currentGeminiKey = apiKey;
  }
  return genAIClient;
}

export async function callGeminiRaw(
  prompt: string,
  options?: {
    jsonMode?: boolean;
    temperature?: number;
    maxTokens?: number;
    timeoutMs?: number;
  }
): Promise<{ text: string; model: string; latencyMs: number }> {
  const config = getCanonicalAIConfig();
  if (!config.isGeminiConfigured || !config.geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not configured on the server");
  }

  const timeoutMs = options?.timeoutMs ?? 7000;
  const modelToTry = config.geminiModel || DEFAULT_GEMINI_MODEL;
  const ai = getGenAIClient(config.geminiApiKey);

  const start = performance.now();
  try {
    const generatePromise = ai.models.generateContent({
      model: modelToTry,
      contents: prompt,
      config: {
        temperature: options?.temperature ?? 0.2,
        ...(options?.maxTokens ? { maxOutputTokens: options.maxTokens } : {}),
        ...(options?.jsonMode ? { responseMimeType: "application/json" } : {}),
      },
    });

    const response = await withTimeout(
      generatePromise,
      timeoutMs,
      `Gemini API request timed out after ${timeoutMs}ms for ${modelToTry}`
    );

    const latencyMs = Math.round(performance.now() - start);
    const rawText = response.text;
    if (!rawText) {
      throw new Error("Empty content returned by Gemini API");
    }

    // Strip markdown code fences if wrapped
    const cleaned = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    markProviderSuccess(geminiHealth, latencyMs);
    return { text: cleaned, model: modelToTry, latencyMs };
  } catch (err: unknown) {
    const latencyMs = Math.round(performance.now() - start);
    geminiHealth.lastLatencyMs = latencyMs;
    const msg = err instanceof Error ? err.message : String(err);
    const lower = msg.toLowerCase();

    if (
      msg.includes("429") ||
      lower.includes("quota") ||
      msg.includes("RESOURCE_EXHAUSTED") ||
      lower.includes("rate limit")
    ) {
      markProviderRateLimited(geminiHealth, msg, 60_000);
    } else if (
      msg.includes("503") ||
      msg.includes("502") ||
      lower.includes("timeout") ||
      lower.includes("network") ||
      lower.includes("fetch failed")
    ) {
      markProviderUnavailable(geminiHealth, msg, 15_000);
    } else {
      geminiHealth.lastStatus = "error";
      geminiHealth.lastError = msg;
    }

    throw err;
  }
}

// ---------------------------------------------------------------------------
// 6. Groq Client & Caller (Secondary AI Provider)
// ---------------------------------------------------------------------------

export async function callGroqRaw(
  prompt: string,
  options?: {
    jsonMode?: boolean;
    temperature?: number;
    maxTokens?: number;
    timeoutMs?: number;
  }
): Promise<{ text: string; model: string; latencyMs: number }> {
  const config = getCanonicalAIConfig();
  if (!config.isGroqConfigured || !config.groqApiKey) {
    throw new Error("GROQ_API_KEY is not configured on the server");
  }

  const timeoutMs = options?.timeoutMs ?? 7000;
  const modelToTry = config.groqModel || DEFAULT_GROQ_MODEL;

  const start = performance.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.groqApiKey}`,
      },
      body: JSON.stringify({
        model: modelToTry,
        messages: options?.jsonMode
          ? [
              {
                role: "system",
                content:
                  "You are LeadMotive AI. Analyze real-estate data and return strictly valid JSON matching the requested schema without markdown backticks or commentary.",
              },
              { role: "user", content: prompt },
            ]
          : [{ role: "user", content: prompt }],
        temperature: options?.temperature ?? 0.2,
        max_tokens: options?.maxTokens ?? 2500,
        ...(options?.jsonMode ? { response_format: { type: "json_object" } } : {}),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const latencyMs = Math.round(performance.now() - start);

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      const msg = `Groq API returned HTTP ${res.status}: ${errText.slice(0, 150)}`;
      if (res.status === 429) {
        markProviderRateLimited(groqHealth, msg, 60_000);
      } else if (res.status >= 500) {
        markProviderUnavailable(groqHealth, msg, 15_000);
      } else {
        groqHealth.lastStatus = "error";
        groqHealth.lastError = msg;
      }
      throw new Error(msg);
    }

    const data = await res.json();
    const rawContent = data.choices?.[0]?.message?.content;
    if (!rawContent || typeof rawContent !== "string") {
      throw new Error("Empty or malformed content in Groq API response");
    }

    // Defensively strip any reasoning/thinking tags emitted by reasoning models like gpt-oss-20b
    const contentWithoutThink = rawContent.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

    const cleaned = contentWithoutThink
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    markProviderSuccess(groqHealth, latencyMs);
    return { text: cleaned, model: modelToTry, latencyMs };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const latencyMs = Math.round(performance.now() - start);
    groqHealth.lastLatencyMs = latencyMs;
    const msg = err instanceof Error ? err.message : String(err);
    const lower = msg.toLowerCase();

    if (lower.includes("abort") || lower.includes("timeout")) {
      markProviderUnavailable(groqHealth, `Groq request timed out after ${timeoutMs}ms`, 15_000);
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// 7. Cascade AI Executor
// ---------------------------------------------------------------------------

export interface CascadeResult {
  text: string;
  provider: "google-gemini" | "groq" | "offline-heuristic";
  model: string | null;
  mode: "live" | "fallback";
  secondaryUsed: boolean;
  fallbackUsed: boolean;
  primaryFailureReason?: string;
  latencyMs: number;
}

export async function executeAIWithCascade(options: {
  prompt: string;
  jsonMode?: boolean;
  temperature?: number;
  maxTokens?: number;
  dedupeKey?: string;
}): Promise<CascadeResult> {
  if (options.dedupeKey) {
    return deduplicateRequest(options.dedupeKey, () =>
      executeAIWithCascadeInternal(options)
    );
  }
  return executeAIWithCascadeInternal(options);
}

async function executeAIWithCascadeInternal(options: {
  prompt: string;
  jsonMode?: boolean;
  temperature?: number;
  maxTokens?: number;
}): Promise<CascadeResult> {
  const config = getCanonicalAIConfig();
  const start = performance.now();
  let primaryFailureReason: string | undefined = undefined;

  // 1. Attempt Primary: Gemini
  if (config.isGeminiConfigured) {
    if (isProviderRateLimited(geminiHealth)) {
      primaryFailureReason = "gemini_rate_limited";
    } else {
      try {
        const geminiRes = await callGeminiRaw(options.prompt, {
          jsonMode: options.jsonMode,
          temperature: options.temperature,
          maxTokens: options.maxTokens,
          timeoutMs: 7000,
        });

        return {
          text: geminiRes.text,
          provider: "google-gemini",
          model: geminiRes.model,
          mode: "live",
          secondaryUsed: false,
          fallbackUsed: false,
          latencyMs: geminiRes.latencyMs,
        };
      } catch (geminiErr: unknown) {
        const msg = geminiErr instanceof Error ? geminiErr.message : String(geminiErr);
        const lower = msg.toLowerCase();
        if (msg.includes("429") || lower.includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) {
          primaryFailureReason = "gemini_quota_exceeded";
        } else if (lower.includes("timeout")) {
          primaryFailureReason = "gemini_timeout";
        } else if (lower.includes("key") || msg.includes("401") || msg.includes("403")) {
          primaryFailureReason = "gemini_invalid_key";
        } else {
          primaryFailureReason = "gemini_unavailable";
        }
      }
    }
  } else {
    primaryFailureReason = "gemini_unconfigured";
  }

  // 2. Attempt Secondary: Groq (if configured)
  if (config.isGroqConfigured) {
    if (!isProviderRateLimited(groqHealth)) {
      try {
        const groqRes = await callGroqRaw(options.prompt, {
          jsonMode: options.jsonMode,
          temperature: options.temperature,
          maxTokens: options.maxTokens,
          timeoutMs: 7000,
        });

        const totalLatency = Math.round(performance.now() - start);
        return {
          text: groqRes.text,
          provider: "groq",
          model: groqRes.model,
          mode: "live",
          secondaryUsed: true,
          fallbackUsed: false,
          primaryFailureReason,
          latencyMs: totalLatency,
        };
      } catch (groqErr) {
        console.warn("[LeadMotive AI Cascade] Secondary Groq attempt failed:", groqErr);
      }
    }
  }

  // 3. Fallback to Deterministic Offline Heuristics
  const totalLatency = Math.round(performance.now() - start);
  return {
    text: "",
    provider: "offline-heuristic",
    model: null,
    mode: "fallback",
    secondaryUsed: false,
    fallbackUsed: true,
    primaryFailureReason,
    latencyMs: totalLatency,
  };
}

// ---------------------------------------------------------------------------
// 8. Diagnostics Support
// ---------------------------------------------------------------------------

export function getPassiveDiagnostics(): DiagnosticsResponse {
  const config = getCanonicalAIConfig();

  if (!config.isAnyConfigured) {
    return {
      configured: false,
      model: config.geminiModel,
      tested: false,
      status: "unconfigured",
      statusLabel: "Configuration Required",
      activeProvider: "offline-heuristic",
      primaryConfigured: false,
      secondaryConfigured: false,
      primaryModel: config.geminiModel,
      secondaryModel: config.groqModel,
      message: "No live AI credentials configured in server environment. Offline heuristic engine active.",
    };
  }

  // Check known runtime state
  if (config.isGeminiConfigured) {
    if (geminiHealth.lastStatus === "ready") {
      return {
        configured: true,
        model: config.geminiModel,
        tested: true,
        status: "ready",
        statusLabel: "Gemini Ready",
        activeProvider: "google-gemini",
        primaryConfigured: true,
        secondaryConfigured: config.isGroqConfigured,
        primaryModel: config.geminiModel,
        secondaryModel: config.isGroqConfigured ? config.groqModel : undefined,
        latencyMs: geminiHealth.lastLatencyMs,
        message: `Primary Gemini connection verified (${geminiHealth.lastLatencyMs ?? 0}ms).`,
        lastTestedAt: geminiHealth.lastTestedAt ? new Date(geminiHealth.lastTestedAt).toISOString() : undefined,
      };
    }

    if (geminiHealth.lastStatus === "rate_limited") {
      if (config.isGroqConfigured && groqHealth.lastStatus === "ready") {
        return {
          configured: true,
          model: config.groqModel,
          tested: true,
          status: "secondary_active",
          statusLabel: "Secondary AI Active",
          activeProvider: "groq",
          primaryConfigured: true,
          secondaryConfigured: true,
          primaryModel: config.geminiModel,
          secondaryModel: config.groqModel,
          latencyMs: groqHealth.lastLatencyMs,
          message: "Gemini is rate-limited. Secondary AI (Groq) is active and serving live responses.",
        };
      }

      return {
        configured: true,
        model: config.geminiModel,
        tested: true,
        status: "rate_limited",
        statusLabel: "Gemini Rate Limited",
        activeProvider: config.isGroqConfigured ? "groq" : "offline-heuristic",
        primaryConfigured: true,
        secondaryConfigured: config.isGroqConfigured,
        primaryModel: config.geminiModel,
        secondaryModel: config.isGroqConfigured ? config.groqModel : undefined,
        message: "Gemini free-tier quota/rate limit reached. Falling back safely.",
      };
    }

    if (geminiHealth.lastStatus === "unavailable") {
      return {
        configured: true,
        model: config.geminiModel,
        tested: true,
        status: "unavailable",
        statusLabel: "Gemini Unavailable",
        activeProvider: config.isGroqConfigured ? "groq" : "offline-heuristic",
        primaryConfigured: true,
        secondaryConfigured: config.isGroqConfigured,
        primaryModel: config.geminiModel,
        secondaryModel: config.isGroqConfigured ? config.groqModel : undefined,
        message: "Gemini service temporarily unavailable or timed out.",
      };
    }
  }

  if (!config.isGeminiConfigured && config.isGroqConfigured) {
    return {
      configured: true,
      model: config.groqModel,
      tested: groqHealth.lastStatus === "ready",
      status: groqHealth.lastStatus === "ready" ? "secondary_active" : "ready",
      statusLabel: "Secondary AI Active",
      activeProvider: "groq",
      primaryConfigured: false,
      secondaryConfigured: true,
      secondaryModel: config.groqModel,
      latencyMs: groqHealth.lastLatencyMs,
      message: "Groq configured as secondary standalone AI provider.",
    };
  }

  // Configured with credentials, not tested yet in this process
  return {
    configured: true,
    model: config.geminiModel,
    tested: false,
    status: "ready",
    statusLabel: "Gemini Configured",
    activeProvider: "google-gemini",
    primaryConfigured: config.isGeminiConfigured,
    secondaryConfigured: config.isGroqConfigured,
    primaryModel: config.geminiModel,
    secondaryModel: config.isGroqConfigured ? config.groqModel : undefined,
    message: "Server AI credentials configured. Click 'Test Connection' for live round-trip verification.",
  };
}

export async function runActiveDiagnostics(): Promise<DiagnosticsResponse> {
  const config = getCanonicalAIConfig();

  if (!config.isAnyConfigured) {
    return {
      configured: false,
      model: config.geminiModel,
      tested: false,
      status: "unconfigured",
      statusLabel: "Configuration Required",
      activeProvider: "offline-heuristic",
      primaryConfigured: false,
      secondaryConfigured: false,
      primaryModel: config.geminiModel,
      secondaryModel: config.groqModel,
      message: "Neither GEMINI_API_KEY nor GROQ_API_KEY is configured in server environment.",
    };
  }

  const start = performance.now();

  // Test Gemini first if configured
  if (config.isGeminiConfigured) {
    try {
      const res = await callGeminiRaw("Reply with 'READY'", {
        jsonMode: false,
        temperature: 0.0,
        maxTokens: 10,
        timeoutMs: 6000,
      });
      const latencyMs = Math.round(performance.now() - start);

      return {
        configured: true,
        model: res.model,
        tested: true,
        status: "ready",
        statusLabel: "Gemini Ready",
        activeProvider: "google-gemini",
        primaryConfigured: true,
        secondaryConfigured: config.isGroqConfigured,
        primaryModel: config.geminiModel,
        secondaryModel: config.isGroqConfigured ? config.groqModel : undefined,
        latencyMs,
        message: `Successfully connected to ${res.model} (${latencyMs}ms). Response verified.`,
        lastTestedAt: new Date().toISOString(),
      };
    } catch (geminiErr: unknown) {
      const latencyMs = Math.round(performance.now() - start);
      const msg = geminiErr instanceof Error ? geminiErr.message : String(geminiErr);
      const lower = msg.toLowerCase();

      // Check if Groq can save the day
      if (config.isGroqConfigured) {
        try {
          const groqRes = await callGroqRaw("Reply with 'READY'", {
            jsonMode: false,
            temperature: 0.0,
            maxTokens: 10,
            timeoutMs: 6000,
          });
          const totalLatency = Math.round(performance.now() - start);

          return {
            configured: true,
            model: groqRes.model,
            tested: true,
            status: "secondary_active",
            statusLabel: "Secondary AI Active",
            activeProvider: "groq",
            primaryConfigured: true,
            secondaryConfigured: true,
            primaryModel: config.geminiModel,
            secondaryModel: config.groqModel,
            latencyMs: totalLatency,
            message: `Gemini unavailable (${lower.includes("429") || lower.includes("quota") ? "rate limit / quota reached" : "transient issue"}). Secondary AI (Groq: ${groqRes.model}) connected in ${groqRes.latencyMs}ms.`,
            lastTestedAt: new Date().toISOString(),
          };
        } catch (groqErr) {
          console.warn("[Diagnostics] Both Gemini and Groq active test failed:", groqErr);
        }
      }

      const isRateLimit =
        msg.includes("429") ||
        lower.includes("quota") ||
        msg.includes("RESOURCE_EXHAUSTED");

      const isUnavailable =
        msg.includes("503") ||
        msg.includes("502") ||
        lower.includes("timeout") ||
        lower.includes("network");

      return {
        configured: true,
        model: config.geminiModel,
        tested: true,
        status: isRateLimit ? "rate_limited" : isUnavailable ? "unavailable" : "error",
        statusLabel: isRateLimit
          ? "Gemini Rate Limited"
          : isUnavailable
          ? "Gemini Unavailable"
          : "Provider Error",
        activeProvider: "offline-heuristic",
        primaryConfigured: true,
        secondaryConfigured: config.isGroqConfigured,
        primaryModel: config.geminiModel,
        secondaryModel: config.isGroqConfigured ? config.groqModel : undefined,
        latencyMs,
        message: isRateLimit
          ? `Gemini quota or rate limit exceeded (${latencyMs}ms). Offline heuristic mode will serve requests safely.`
          : isUnavailable
          ? `Gemini is temporarily unavailable (${latencyMs}ms). Offline heuristic mode active.`
          : `Connection test failed (${latencyMs}ms): ${msg.slice(0, 120)}`,
        lastTestedAt: new Date().toISOString(),
      };
    }
  }

  // If only Groq is configured
  if (config.isGroqConfigured) {
    try {
      const groqRes = await callGroqRaw("Reply with 'READY'", {
        jsonMode: false,
        temperature: 0.0,
        maxTokens: 10,
        timeoutMs: 6000,
      });
      const latencyMs = Math.round(performance.now() - start);

      return {
        configured: true,
        model: groqRes.model,
        tested: true,
        status: "secondary_active",
        statusLabel: "Secondary AI Active",
        activeProvider: "groq",
        primaryConfigured: false,
        secondaryConfigured: true,
        secondaryModel: config.groqModel,
        latencyMs,
        message: `Connected to Groq (${groqRes.model}) in ${latencyMs}ms.`,
        lastTestedAt: new Date().toISOString(),
      };
    } catch (groqErr) {
      const latencyMs = Math.round(performance.now() - start);
      const msg = groqErr instanceof Error ? groqErr.message : String(groqErr);
      return {
        configured: true,
        model: config.groqModel,
        tested: true,
        status: "error",
        statusLabel: "Provider Error",
        activeProvider: "offline-heuristic",
        primaryConfigured: false,
        secondaryConfigured: true,
        secondaryModel: config.groqModel,
        latencyMs,
        message: `Groq connection test failed (${latencyMs}ms): ${msg.slice(0, 120)}`,
        lastTestedAt: new Date().toISOString(),
      };
    }
  }

  return getPassiveDiagnostics();
}
