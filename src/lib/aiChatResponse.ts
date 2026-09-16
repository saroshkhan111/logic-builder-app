import { parseJsonObject } from "@/lib/jsonResponse";

/**
 * Parser + helpers for the AI Chat response shape.
 *
 * The tutor model is asked to answer with strict JSON so the UI can show two
 * things:
 * - `reply`      → the normal English answer
 * - `correction` → what the learner did wrong, how to fix it, and an example
 *                  of the correct approach (empty when nothing is wrong)
 *
 * Models sometimes ignore the JSON instruction or wrap it in a markdown fence,
 * so parsing always falls back to treating the raw text as the reply and
 * leaves `correction` empty.
 */

export interface AIChatResponse {
  /** The tutor's normal answer (English, 2-4 sentences). */
  reply: string;
  /**
   * What the learner did wrong + how to fix it + one example of the correct
   * approach. Empty string when the learner has not made a mistake.
   */
  correction: string;
}

/** Placeholder strings the model emits when there is nothing to correct. */
const NO_CORRECTION_VALUES = new Set([
  "",
  "-",
  "n/a",
  "na",
  "none",
  "no correction",
  "no mistake",
  "null",
]);

/** True when `correction` holds a real correction (not an empty placeholder). */
export function hasCorrection(correction: string | null | undefined): boolean {
  return typeof correction === "string" && correction.trim().length > 0;
}

/**
 * Normalizes the model's `correction` value: non-strings become `""` and the
 * placeholders above ("none", "n/a", ...) are treated as "no correction".
 */
export function normalizeCorrection(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return NO_CORRECTION_VALUES.has(trimmed.toLowerCase()) ? "" : trimmed;
}

/**
 * Parses the raw model content into `{ reply, correction }`.
 *
 * - Valid JSON (raw, fenced, or embedded) → uses its `reply` / `correction`.
 * - Anything else → the whole text becomes `reply`, `correction` stays empty.
 */
export function parseAIChatResponse(
  raw: string | null | undefined
): AIChatResponse {
  const text = (raw ?? "").trim();
  if (!text) return { reply: "", correction: "" };

  const parsed = parseJsonObject(text);
  if (parsed && typeof parsed.reply === "string" && parsed.reply.trim()) {
    return {
      reply: parsed.reply.trim(),
      correction: normalizeCorrection(parsed.correction),
    };
  }

  return { reply: text, correction: "" };
}
