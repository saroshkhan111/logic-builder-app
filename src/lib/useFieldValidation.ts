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
 * - the value is debounced (1s by default) so typing does not spam the API
 * - `enabled` lets the caller run the fields in sequence: the next field is
 *   only submitted once the previous one is accepted
 * - fixing the value re-validates it, and identical step/field/value triples
 *   are served from a small in-memory cache
 * - a failing API/key produces `unavailable` (fail-open) instead of blocking
 *   the learner with a verdict the AI never gave
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
}

/** Wait this long after the last keystroke before asking the AI. */
export const DEFAULT_FIELD_VALIDATION_DEBOUNCE_MS = 1000;

const MAX_CACHE_ENTRIES = 100;

const resultCache = new Map<string, FieldValidationResult>();

/** Drops cached verdicts (used by tests and when the problem changes). */
export function clearFieldValidationCache(): void {
  resultCache.clear();
}

const IDLE_STATE: FieldValidationState = {
  status: "idle",
  result: null,
  message: "",
  validatedValue: "",
};

const UNAVAILABLE_MESSAGE =
  "AI check abhi nahi chala. Aap value edit karke dobara try kar sakte ho.";

function cacheResult(key: string, result: FieldValidationResult): void {
  resultCache.set(key, result);
  if (resultCache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = resultCache.keys().next().value;
    if (oldestKey) resultCache.delete(oldestKey);
  }
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

export function useFieldValidation({
  step,
  fieldName,
  value,
  problemStatement,
  existingData,
  enabled = true,
  debounceMs = DEFAULT_FIELD_VALIDATION_DEBOUNCE_MS,
}: UseFieldValidationOptions): FieldValidationState {
  const trimmedValue = value.trim();
  const debouncedValue = useDebounce(trimmedValue, debounceMs);

  const isActive = enabled && debouncedValue.length > 0;
  const cacheKey = isActive
    ? fieldValidationKey(step, fieldName, debouncedValue)
    : null;
  const cached = cacheKey ? (resultCache.get(cacheKey) ?? null) : null;

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

    const validate = async () => {
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

        if (requestId !== requestIdRef.current) return;
        if (!response.ok) throw new Error(`AI check failed: ${response.status}`);

        const parsed = parseFieldValidation(await response.json());
        if (!parsed) throw new Error("AI returned an unusable validation");

        if (requestId !== requestIdRef.current) return;
        cacheResult(fieldValidationKey(step, fieldName, debouncedValue), parsed);
        setState(stateForResult(parsed, debouncedValue));
      } catch (error) {
        if ((error as Error)?.name === "AbortError") return;
        if (requestId !== requestIdRef.current) return;

        console.warn("Field validation error:", error);
        setState({
          status: "unavailable",
          result: null,
          message: UNAVAILABLE_MESSAGE,
          validatedValue: debouncedValue,
        });
      }
    };

    void validate();

    return () => controller.abort();
  }, [
    isActive,
    cached,
    debouncedValue,
    step,
    fieldName,
    problemStatement,
    existingData,
  ]);

  return state;
}