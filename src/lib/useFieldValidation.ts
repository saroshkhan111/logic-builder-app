"use client";

import { useEffect, useRef, useState } from "react";

import type { FieldValidationResult } from "@/lib/fieldValidation";
import {
  fieldValidationKey,
  parseFieldValidation,
} from "@/lib/fieldValidation";
import { useDebounce } from "@/lib/useDebounce";

/**
 * Validates ONE field value with `/api/field-validate` while the learner types.
 *
 * Groq's free tier allows only ~30 requests/minute, so this hook spends
 * requests very carefully:
 *
 * - the value is debounced (3s by default) so typing does not spam the API
 * - a module-level queue keeps ONE /api/field-validate request in flight at a
 *   time across the whole app; every other validation waits for its turn
 * - a 429 response is retried with backoff (5s, then 15s) before giving up
 * - verdicts are cached for 5 minutes, so re-entering a previous value never
 *   spends another request
 * - `enabled` lets the caller run the fields in sequence: the next field is
 *   only submitted once the previous one is accepted
 * - fixing the value re-validates it
 * - a failing API/key/rate limit produces `unavailable` (fail-open) instead of
 *   blocking the learner with a verdict the AI never gave
 */

export type FieldValidationStatus =
  | "idle"
  | "checking"
  | "valid"
  | "invalid"
  | "unavailable";

export interface FieldValidationState {
  status: FieldValidationStatus;
  result: FieldValidationResult | null;
  /** Learner-facing note when the AI check could not run. */
  message: string;
  /** The value this state describes ("" when idle); guards stale verdicts. */
  validatedValue: string;
}

export interface UseFieldValidationOptions {
  step: number;
  fieldName: string;
  value: string;
  problemStatement?: string;
  /** Earlier/accepted fields, rendered as `Label: value` pairs. */
  existingData?: string;
  /** When false the field is not checked yet (sequence gate). */
  enabled?: boolean;
  debounceMs?: number;
  /**
   * Backoff waits before each 429 retry. Production default: 5s then 15s.
   * Tests inject tiny delays so the retry behavior stays fast to verify.
   */
  rateLimitRetryDelaysMs?: number[];
}

/** Wait this long after the last keystroke before asking the AI. */
export const DEFAULT_FIELD_VALIDATION_DEBOUNCE_MS = 3000;

const MAX_CACHE_ENTRIES = 100;

/** Cached verdicts older than this count as misses and are re-validated. */
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Backoff before each 429 retry: 5s after the first, 15s after the second.
 * The retry count is `length` — with 2 entries a rate-limited run makes 3
 * attempts (initial call + 2 retries) before giving up.
 */
export const RATE_LIMIT_RETRY_DELAYS_MS = [5000, 15000];

const RATE_LIMITED_MESSAGE =
  "AI is busy (rate limit). Edit the value and try again in a moment.";

interface CacheEntry {
  result: FieldValidationResult;
  timestamp: number;
}

const resultCache = new Map<string, CacheEntry>();

/** Drops cached verdicts (used by tests and when the problem changes). */
export function clearFieldValidationCache(): void {
  resultCache.clear();
}

// ── App-wide request queue ────────────────────────────────────────────
// Groq rate limits per API key, not per component, so "one request at a time"
// has to live at module scope: at most ONE /api/field-validate request
// (including its 429 backoff waits) is in flight anywhere in the app, and
// every other validation task waits for the previous one to settle.
let validationQueue: Promise<void> = Promise.resolve();

function enqueueValidation<T>(task: () => Promise<T>): Promise<T> {
  const run = validationQueue.then(task);
  // Whichever way the task settles, the next queued task must still run.
  validationQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const IDLE_STATE: FieldValidationState = {
  status: "idle",
  result: null,
  message: "",
  validatedValue: "",
};

const UNAVAILABLE_MESSAGE =
  "The AI check did not run. Edit the value and try again.";

function cacheResult(key: string, result: FieldValidationResult): void {
  resultCache.set(key, { result, timestamp: Date.now() });
  if (resultCache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = resultCache.keys().next().value;
    if (oldestKey) resultCache.delete(oldestKey);
  }
}

/** Cache hit only while the entry is younger than the TTL. */
function getCachedResult(key: string): FieldValidationResult | null {
  const entry = resultCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp >= CACHE_TTL_MS) {
    resultCache.delete(key);
    return null;
  }
  return entry.result;
}

function stateForResult(
  result: FieldValidationResult,
  validatedValue: string
): FieldValidationState {
  return {
    status: result.isCorrect ? "valid" : "invalid",
    result,
    message: "",
    validatedValue,
  };
}

/** State a fresh render shows before this value's verdict is known. */
function initialStateFor(
  isActive: boolean,
  cached: FieldValidationResult | null,
  debouncedValue: string
): FieldValidationState {
  if (!isActive) return IDLE_STATE;
  if (cached) return stateForResult(cached, debouncedValue);
  return {
    status: "checking",
    result: null,
    message: "",
    validatedValue: debouncedValue,
  };
}

/** How one queued validation run ended. */
type ValidationOutcome =
  | { kind: "success"; result: FieldValidationResult }
  | { kind: "rate-limited" }
  | { kind: "error" };

export function useFieldValidation({
  step,
  fieldName,
  value,
  problemStatement,
  existingData,
  enabled = true,
  debounceMs = DEFAULT_FIELD_VALIDATION_DEBOUNCE_MS,
  rateLimitRetryDelaysMs = RATE_LIMIT_RETRY_DELAYS_MS,
}: UseFieldValidationOptions): FieldValidationState {
  const trimmedValue = value.trim();
  const debouncedValue = useDebounce(trimmedValue, debounceMs);

  // Stabilized access to the (test-injectable) retry delays: the validation
  // effect reads them through a ref and depends on a joined key, so an inline
  // array literal from a caller can never re-trigger the effect on every
  // render. The ref is synced in an effect (declared before the validation
  // effect, which also depends on the joined key), never during render.
  const retryDelaysRef = useRef(rateLimitRetryDelaysMs);
  useEffect(() => {
    retryDelaysRef.current = rateLimitRetryDelaysMs;
  }, [rateLimitRetryDelaysMs]);
  const retryDelaysKey = rateLimitRetryDelaysMs.join(",");

  const isActive = enabled && debouncedValue.length > 0;
  const cacheKey = isActive
    ? fieldValidationKey(step, fieldName, debouncedValue)
    : null;
  const cached = cacheKey ? getCachedResult(cacheKey) : null;

  // Identifies exactly what the current state describes. When it changes, the
  // state is reset during render (the React "adjust state when props change"
  // pattern) instead of inside an effect, so a new value never triggers a
  // synchronous setState cascading through an effect body.
  const requestKey = [
    isActive ? "on" : "off",
    step,
    fieldName,
    problemStatement ?? "",
    existingData ?? "",
    debouncedValue,
    cached ? "cached" : "fresh",
  ].join("|");

  const [state, setState] = useState<FieldValidationState>(() =>
    initialStateFor(isActive, cached, debouncedValue)
  );
  const [renderedKey, setRenderedKey] = useState(requestKey);
  if (renderedKey !== requestKey) {
    setRenderedKey(requestKey);
    setState(initialStateFor(isActive, cached, debouncedValue));
  }

  // Only the newest response may update the state (older ones are stale).
  const requestIdRef = useRef(0);

  useEffect(() => {
    // Nothing to fetch: the field is inactive or already answered (cache hit).
    if (!isActive || cached) return;

    const controller = new AbortController();
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    /** True while this effect run is still the newest one. */
    const isCurrent = () => requestId === requestIdRef.current;

    /**
     * One validation run. A 429 is retried with backoff (5s, then 15s in
     * production) instead of surfacing the rate limit as an error; once the
     * retries are exhausted the run gives up with a dedicated rate-limited
     * verdict ("unavailable" — fail-open, never blocks the learner).
     */
    const validateWithRetry = async (
      attempt = 1
    ): Promise<ValidationOutcome> => {
      // A newer value/field took over while this run waited in the queue or
      // in a backoff sleep — drop it without spending a request.
      if (!isCurrent()) return { kind: "error" };

      try {
        const response = await fetch("/api/field-validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            step,
            fieldName,
            fieldValue: debouncedValue,
            problemStatement,
            existingData,
          }),
          signal: controller.signal,
        });

        if (!isCurrent()) return { kind: "error" };

        if (response.status === 429) {
          const delays = retryDelaysRef.current;
          if (attempt <= delays.length) {
            await wait(delays[attempt - 1]);
            return validateWithRetry(attempt + 1);
          }
          return { kind: "rate-limited" };
        }

        if (!response.ok) return { kind: "error" };

        const parsed = parseFieldValidation(await response.json());
        if (!parsed) return { kind: "error" };
        return { kind: "success", result: parsed };
      } catch (error) {
        if ((error as Error)?.name === "AbortError") return { kind: "error" };
        console.warn("Field validation error:", error);
        return { kind: "error" };
      }
    };

    // Serialized app-wide: this run only starts once no other validation
    // request (or its 429 backoff) is in flight.
    void enqueueValidation(async () => {
      const outcome = await validateWithRetry();
      // A newer run owns the UI now — a stale run never touches the state.
      if (!isCurrent()) return;

      if (outcome.kind === "success") {
        cacheResult(
          fieldValidationKey(step, fieldName, debouncedValue),
          outcome.result
        );
        setState(stateForResult(outcome.result, debouncedValue));
      } else if (outcome.kind === "rate-limited") {
        setState({
          status: "unavailable",
          result: null,
          message: RATE_LIMITED_MESSAGE,
          validatedValue: debouncedValue,
        });
      } else {
        setState({
          status: "unavailable",
          result: null,
          message: UNAVAILABLE_MESSAGE,
          validatedValue: debouncedValue,
        });
      }
    });

    return () => controller.abort();
  }, [
    isActive,
    cached,
    debouncedValue,
    step,
    fieldName,
    problemStatement,
    existingData,
    retryDelaysKey,
  ]);

  return state;
}