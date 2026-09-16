/**
 * Types + prompt/parser helpers for the sequence-based field validator
 * (`/api/field-validate`).
 *
 * The learner fills ONE field of the current step at a time. The AI checks that
 * single value against the problem context and answers with `isCorrect` plus a
 * short reason, a correction and a hint for the next field. Parsing is
 * defensive (same idea as `stepMcq.ts`): a validation is only returned when the
 * model produced a usable boolean, so a truncated answer can never mark a wrong
 * value as correct.
 */

import { normalizeCorrection } from "@/lib/aiChatResponse";
import { parseJsonObject } from "@/lib/jsonResponse";

export interface FieldValidationResult {
  /** True when the learner's value is right for this field/problem. */
  isCorrect: boolean;
  /** Why it is right / wrong (simple English, 2 sentences). */
  reason: string;
  /** How to fix it (simple English). Empty when the value is correct. */
  correction: string;
  /** What to focus on in the NEXT field (simple English). Empty when wrong. */
  nextHint: string;
}

export interface FieldValidationContext {
  /** Step of the 6-step flow the field belongs to (1-6). */
  step: number;
  /** Label of the field being checked, e.g. "Required Data". */
  fieldName: string;
  /** What the learner typed. */
  fieldValue: string;
  problemStatement?: string;
  /** Already-filled/earlier fields, rendered as `Label: value` pairs. */
  existingData?: string;
}
/**
 * What the current step expects in each of its fields. Without this the model
 * falls back to generic advice ("use a good variable name") instead of
 * judging the value against this problem.
 */
const STEP_VALIDATION_GUIDES: Record<number, string> = {
  1: `Step 1 fields:
- Problem Statement: what the program will do (clear, solvable description)
- Inputs: which data comes in + its data type, e.g. "num (integer)"
- Outputs: what it produces, e.g. "result (string)" / "Even or Odd"
- Rules: conditions / constraints / edge cases of the problem`,

  2: `Step 2 fields:
- Required Data: which data type is needed, e.g. "number (integer)"
- Tools & Functions: which operator/tool will be used, e.g. "% operator", "print()"
- Logical Concepts: which thinking pattern is needed, e.g. "IF/ELSE", "loop"`,

  3: `Step 3 fields:
- Algorithm: ordered pseudocode lines from START to END, using THIS problem's
  variables (INPUT, SET, IF/ELSE, DISPLAY, END)
- Pseudocode Steps: the numbered lines of the algorithm`,

  4: `Step 4 fields:
- File Name: snake_case Python file, e.g. "even_odd.py"
- Python Code: valid Python code for THIS problem (def/return/if-else/print)
- Code Notes: a short explanation of the code`,

  5: `Step 5 fields:
- Test Cases: input + expected output pairs for THIS problem
- Expected Output: the correct output for that input
- Edge Cases: boundary values, e.g. 0, negative, very large`,

  6: `Step 6 fields:
- Complexity: time/space complexity of the solution, e.g. "O(1)"
- Optimization: concrete improvements to the code`,
};

/** Used when a field is validated for a step outside 1-6. */
const STEP_VALIDATION_GUIDE_FALLBACK =
  "General programming field: value must be specific and correct for the problem.";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Accepts `true`/`false` as booleans, numbers or words ("yes", "correct", ...). */
function toBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;

  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
    return null;
  }

  if (typeof value === "string") {
    const text = value.trim().toLowerCase();
    if (["true", "yes", "correct", "1"].includes(text)) return true;
    if (["false", "no", "incorrect", "0"].includes(text)) return false;
  }

  return null;
}

/**
 * Cache/react key for one validated value. The step + field + value triple is
 * what the AI actually judges, so identical triples share one result.
 */
export function fieldValidationKey(
  step: number,
  fieldName: string,
  fieldValue: string
): string {
  return `${step}|${fieldName.trim()}|${fieldValue.trim()}`;
}
/**
 * Prompt for the validation model call.
 *
 * The value is always judged against the problem above plus the "what this step
 * expects" block, so the same value can be correct on one step and wrong on
 * another (e.g. "num (integer)" is fine as an Input but not as a File Name).
 */
export function buildFieldValidationPrompt({
  step,
  fieldName,
  fieldValue,
  problemStatement,
  existingData,
}: FieldValidationContext): string {
  const guide = STEP_VALIDATION_GUIDES[step] || STEP_VALIDATION_GUIDE_FALLBACK;

  return `You are validating ONE field a beginner filled in a programming learning app.

=== CONTEXT ===
Problem: ${problemStatement || "Not defined"}
Current Step: ${step}/6
Field being filled: "${fieldName}"
User entered: "${fieldValue}"
Already filled fields: ${existingData || "None"}

=== WHAT THIS STEP EXPECTS ===
${guide}

=== YOUR TASK ===
Check if the user's input is CORRECT for THIS field in THIS problem.

=== RULES ===
1. Judge based on the problem context above, not generic rules
2. If the field requires a specific type/format, check that
   (e.g. Inputs need data + type, Required Data needs a data type,
   File Name needs snake_case ".py", Test Cases need input + expected output)
3. Accept a short, beginner-level answer when it is right for THIS problem
4. "reason" explains WHY it is right/wrong in simple English (2 sentences max)
5. "correction" shows how to fix it in simple English. Use "" when it is correct
6. "nextHint" is a short hint for the NEXT field in simple English, only when correct
   ("" when the answer is wrong)
7. Use simple, beginner-friendly English. Technical terms can stay English
8. Keep every value on one line: no code blocks, no line breaks

=== RETURN ONLY JSON ===
Return ONLY valid JSON (no markdown, no text outside the JSON):
{
  "isCorrect": true,
  "reason": "Why it is correct or wrong (simple English)",
  "correction": "How to fix it if it is wrong (simple English)",
  "nextHint": "A short hint for the next field (simple English, only if correct)"
}`;
}

/**
 * Parses a model answer (raw text or already-parsed object) into a
 * `FieldValidationResult`. Returns `null` when the payload has no usable
 * `isCorrect`, so the UI can fall back to "AI check unavailable" instead of
 * showing a wrong verdict.
 */
export function parseFieldValidation(
  raw: unknown
): FieldValidationResult | null {
  const parsed = typeof raw === "string" ? parseJsonObject(raw) : asRecord(raw);
  if (!parsed) return null;

  const isCorrect = toBoolean(parsed.isCorrect);
  if (isCorrect === null) return null;

  return {
    isCorrect,
    reason: toText(parsed.reason),
    correction: normalizeCorrection(parsed.correction),
    // A wrong answer must not suggest moving on to the next field.
    nextHint: isCorrect ? normalizeCorrection(parsed.nextHint) : "",
  };
}