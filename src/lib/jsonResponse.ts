/**
 * Shared helpers for parsing "strict JSON" model responses.
 *
 * Every AI route (/api/ai-chat, /api/step-mcq, ...) asks the model for JSON
 * only, but models sometimes wrap the payload in a markdown fence or add a
 * sentence around it. These helpers try the raw text first, then the fenced
 * version, and finally the first `{ ... }` block, so all features share the
 * same fallback chain.
 */

/** Removes a surrounding ```json ... ``` (or ```) fence. */
export function stripCodeFence(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

/** Returns the first `{ ... }` block of `text` ("" when there is none). */
export function extractJsonObject(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  return start === -1 || end <= start ? "" : text.slice(start, end + 1);
}

/**
 * Parses `text` into a plain object using the fallback chain above.
 * Returns `null` when none of the candidates is a JSON object.
 */
export function parseJsonObject(
  text: string | null | undefined
): Record<string, unknown> | null {
  const trimmed = (text ?? "").trim();
  if (!trimmed) return null;

  const candidates = [
    trimmed,
    stripCodeFence(trimmed),
    extractJsonObject(trimmed),
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;

    try {
      const parsed: unknown = JSON.parse(candidate);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // Try the next candidate (fenced / embedded JSON).
    }
  }

  return null;
}
