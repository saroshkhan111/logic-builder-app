/**
 * Types + prompt/parser helpers for the AI MCQ Quiz (`/api/step-mcq`).
 *
 * The tutor model is asked for ONE multiple-choice question about the step the
 * learner is currently on. Parsing is defensive: a quiz is only returned when
 * the question, the options and the `correctIndex` are all usable, so a
 * truncated or malformed model answer can never show a wrong "correct answer".
 */

import { normalizeCorrection } from "@/lib/aiChatResponse";
import { parseJsonObject } from "@/lib/jsonResponse";

export interface StepMCQ {
    /** The question shown to the learner (simple English). */
  question: string;
  /** Answer choices; the model is asked for 4 but any count >= 2 is accepted. */
  options: string[];
  /** 0-based index of the correct option inside `options`. */
  correctIndex: number;
  /** Why the correct option is right (simple English, 2 sentences). */
  reasonCorrect: string;
  /** Why the picked option is wrong (simple English, 2 sentences). */
  reasonWrong: string;
  /** How to fix it + one example (simple English). Empty when there is nothing to fix. */
  correction: string;
  /** Short English label for the idea being tested. */
  concept: string;
}

export interface StepMCQContext {
  /** Current step of the 6-step flow (1-6). */
  step: number;
  problemStatement?: string;
  inputs?: string[];
  outputs?: string[];
  rules?: string[];
  /**
   * Field of the CURRENT step the learner is working on (e.g. "Required Data"
   * on Step 2). Optional: when the UI does not track a focused field the model
   * picks one of the step's fields itself.
   */
  currentField?: string;
}

/** Options the model is asked to return (the UI labels them A-D). */
export const MCQ_OPTION_COUNT = 4;

/**
 * Per-step FIELD block. This is what keeps the quiz on the fields the learner
 * is actually filling in on the CURRENT step instead of drifting back to an
 * earlier step (the bug: on Step 2 the quiz kept asking about Step 1 inputs).
 */
const STEP_MCQ_FIELDS: Record<number, string> = {
  1: `STEP 1 FIELDS:
- Problem Statement: "What will this program do?"
- Inputs: "What data will come in?"
- Outputs: "What will be produced?"
- Rules: "What are the conditions?"
Ask about the SPECIFIC FIELD the user is currently working on.`,

  2: `STEP 2 FIELDS:
- Required Data: "Which data type is needed?" (integer, string, float)
- Tools & Functions: "Which operator/tool will be used?" (%, +, ==, print)
- Logical Concepts: "Which thinking pattern is needed?" (IF/ELSE, loop)

CRITICAL: Do NOT ask about problem inputs here. Ask about:
- Which data type is needed for THIS problem's input
- Which operator/tool is needed
- Which logical concept applies

Example questions for Step 2:
- "What is the Required Data for an even/odd check?" -> integer
- "Which operator checks even/odd?" -> %
- "Which concept checks even/odd?" -> IF/ELSE`,

    3: `STEP 3 FIELDS:
- Algorithm Writer: "What is the first line of the algorithm?" (START)
- Decision: "How do we write the IF condition?" (IF number % 2 == 0)
- Display: "How do we show the output?" (DISPLAY "Even")
- End: "How does the algorithm end?" (END)

Ask about SPECIFIC algorithm lines using THIS problem's variables.`,

  4: `STEP 4 FIELDS:
- File Name: "What is the Python file name?" (even_odd.py)
- Function Definition: "How do we define the function?" (def check_even_odd)
- Condition: "How do we write the if condition?" (if number % 2 == 0)
- Return: "What do we return?" (return "Even")

Ask about PYTHON SYNTAX for THIS problem.`,

  5: `STEP 5 FIELDS:
- Test Cases: "Which test case is a boundary case?" (number = 0)
- Expected Output: "What output will this input give?"
- Edge Cases: "Which edge case will we test?" (number = -1, 1000)

Ask about TEST CASES specific to THIS problem.`,

  6: `STEP 6 FIELDS:
- Complexity: "What is the time complexity?" (O(1))
- Optimization: "How can we improve the code?"

Ask about OPTIMIZATION of THIS problem.`,
};

/** Used when a quiz is requested for a step outside 1-6. */
const STEP_MCQ_FIELDS_FALLBACK = "General programming question";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Trims the options and drops empty / non-string ones. */
function normalizeOptions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((option) => (typeof option === "string" ? option.trim() : ""))
    .filter((option) => option.length > 0);
}

/**
 * Coerces `correctIndex` (number or numeric string) into a valid 0-based index.
 * Returns -1 when it is missing, not an integer, or outside `options`.
 */
function normalizeCorrectIndex(value: unknown, optionCount: number): number {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseInt(value.trim(), 10)
        : Number.NaN;

  if (!Number.isInteger(parsed) || parsed < 0 || parsed >= optionCount) {
    return -1;
  }

  return parsed;
}

/**
 * Prompt for the MCQ model call, built from the learner's current step.
 *
 * The step FIELD block is the whole point: the quiz must test the fields of
 * the step the learner is on right now (Step 2 => Required Data, Tools &
 * Functions, Logical Concepts) and never drift back to a previous step.
 *
 * `StepMCQContext` keeps its fields optional (the API/UI may not have all the
 * step data yet), so the arrays default to empty and are rendered as
 * "None defined" instead of throwing.
 */
export function buildStepMCQPrompt({
  step,
  problemStatement,
  inputs = [],
  outputs = [],
  rules = [],
  currentField,
}: StepMCQContext): string {
  const fieldGuide = STEP_MCQ_FIELDS[step] || STEP_MCQ_FIELDS_FALLBACK;
  const focusedField = toText(currentField);
  const currentFieldContext = focusedField
    ? `\nUser is currently working on: "${focusedField}"\nAsk about THIS specific field.`
    : "";

    return `You are a friendly programming tutor for beginners.

Respond in simple, beginner-friendly English. Use short sentences. No Roman Urdu
or Hindi. Technical terms can stay English.

Write ONE multiple-choice quiz question about the step the learner is on right now.

=== PROBLEM ===
Problem Statement: ${problemStatement || "Not defined yet"}
Inputs (Step 1 data - context only): ${inputs.join(", ") || "None defined"}
Outputs (Step 1 data - context only): ${outputs.join(", ") || "None defined"}
Rules (Step 1 data - context only): ${rules.join(", ") || "None defined"}

=== CURRENT STEP ===
Current Step: ${step}/6
${fieldGuide}
${currentFieldContext}

=== RULES ===
1. Question MUST be about Step ${step}'s fields (as listed above)
2. Do NOT ask about previous steps
3. Use SPECIFIC keywords from the problem
4. For Step 2: ask about data types, operators, concepts - NOT problem inputs
5. Options: ${MCQ_OPTION_COUNT} (1 correct, 3 wrong, all different and short,
   max 10 words each)
6. Reasons in simple English. Technical terms can stay English
7. Options must be realistic choices (1 correct, 3 plausible wrong)
8. Reason must explain WHY it's correct/wrong FOR THIS PROBLEM
9. Correction should show HOW to fix using THIS PROBLEM's example
10. Every option stays on ONE line: no code blocks and no line breaks
11. Never tag the answer inside an option text (no "(correct)" or "(wrong)" hints)
12. "correctIndex" is the 0-based index of the correct option inside "options"
13. "reasonCorrect" explains why the correct option is right in exactly 2 sentences
14. "reasonWrong" explains why a wrong pick is wrong in exactly 2 sentences
15. "correction" says how to fix the mistake with one tiny inline example, on one
    line and without code blocks. Use "" if nothing is wrong.
16. "concept" is a short (1-3 word) English name for the idea being tested,
    e.g. "Modulo check", "Function syntax"

=== STYLE EXAMPLE ===
Study the STYLE only. Do NOT reuse the even/odd content below unless the
problem in the context above is actually about even/odd checks.

Step 1 BAD (generic):
"How would you write the question in English?"
Options: Data, Function, Loop, Variable

Step 1 GOOD (specific):
"What input does an even/odd check need?"
Options:
A) an integer number (correct - even/odd works on integers only)
B) a string name (wrong - strings cannot be checked for even/odd)
C) a float value (wrong - floats need different logic)
D) anything (wrong - a specific data type is needed)

Step 2 BAD (asks about Step 1 instead of Step 2):
"What is an input?"
Options: Data, Function, Loop, Variable

Step 2 GOOD (asks about a Step 2 field):
"What is the Required Data for an even/odd check?"
Options:
A) integer (correct - even/odd is checked on integers only)
B) string (wrong - modulo does not work on strings)
C) float (wrong - floats need different logic)
D) list (wrong - this data type does not fit this problem)

Step 3 BAD (generic):
"What is the first keyword in the algorithm?"
Options: DISPLAY, START, INPUT, SET

Step 3 GOOD (specific):
"Which line checks the number in the even/odd algorithm?"
Options:
A) IF number % 2 == 0 THEN (correct - modulo check)
B) IF number > 0 THEN (wrong - this only checks positive numbers)
C) IF number == 2 THEN (wrong - this only checks the number 2)
D) IF number * 2 THEN (wrong - multiplication cannot check even/odd)

=== RETURN ONLY JSON ===
Return ONLY valid JSON (no markdown, no text outside the JSON):
{
  "question": "Problem-specific question (simple English)",
  "options": ["A text", "B text", "C text", "D text"],
  "correctIndex": 0,
  "reasonCorrect": "It is correct because... (problem-specific reason)",
  "reasonWrong": "It is wrong because... (problem-specific reason)",
  "correction": "The correct way... (with THIS problem's example)",
  "concept": "Short concept name (e.g. Modulo check, Function syntax)"
}`;
}

/**
 * Parses a model answer (raw text or already-parsed object) into a `StepMCQ`.
 * Returns `null` when the payload is not a usable quiz.
 */
export function parseStepMCQ(raw: unknown): StepMCQ | null {
  const parsed = typeof raw === "string" ? parseJsonObject(raw) : asRecord(raw);
  if (!parsed) return null;

  const question = toText(parsed.question);
  const options = normalizeOptions(parsed.options);
  if (!question || options.length < 2) return null;

  const correctIndex = normalizeCorrectIndex(
    parsed.correctIndex,
    options.length
  );
  if (correctIndex === -1) return null;

  return {
    question,
    options,
    correctIndex,
    reasonCorrect: toText(parsed.reasonCorrect),
    reasonWrong: toText(parsed.reasonWrong),
    correction: normalizeCorrection(parsed.correction),
    concept: toText(parsed.concept),
  };
}
