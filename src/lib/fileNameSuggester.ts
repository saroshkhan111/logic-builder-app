/**
 * @fileoverview Smart PEP 8 file-name suggestions for Step 4.
 *
 * Generates 3-5 lower_snake_case.py filenames from the problem statement,
 * the user's Python code (function names), and the input/output labels.
 * Pure rule-based matching — no network or Pyodide required.
 */

/** Valid PEP 8 file names: lowercase letters, digits, underscores + .py */
const PEP8_NAME_RE = /^[a-z0-9_]+\.py$/;
const MAX_NAME_LENGTH = 40;
const MAX_SUGGESTIONS = 5;
const MIN_SUGGESTIONS = 3;

/** Names used when nothing keyword- or code-based matches. */
const FALLBACK_NAMES = ["main.py", "solution.py", "program.py"];

/** Matches top-level `def` statements (column 0). */
const FUNCTION_RE = /^def\s+([a-zA-Z_][a-zA-Z0-9_]*)/gm;

/** Verb prefixes stripped to produce a shorter descriptive name. */
const VERB_PREFIXES = [
  "check_",
  "calculate_",
  "calc_",
  "compute_",
  "find_",
  "get_",
  "print_",
  "show_",
  "display_",
  "solve_",
];

/** Names that are too generic to be useful file names on their own. */
const GENERIC_BASES = new Set([
  "main",
  "solve",
  "solution",
  "run",
  "execute",
  "process",
  "handler",
  "helper",
  "util",
  "utils",
  "function",
  "func",
  "app",
  "index",
  "test",
]);

/** A rule that maps a keyword pattern to a list of candidate base names (no .py). */
interface NameRule {
  matcher: RegExp;
  getNames: (combined: string) => string[];
}

/** Temperature gets direction-aware names, so it is handled first. */
const temperatureRule: NameRule = {
  matcher: /celsius|fahrenheit|kelvin|temperature/,
  getNames: (combined) => {
    const hasCelsius = /celsius/.test(combined);
    const hasFahrenheit = /fahrenheit/.test(combined);

    if (hasCelsius && hasFahrenheit) {
      // Check for explicit fahrenheit -> celsius direction
      const fToC =
        /from\s*(?:degree\s*)?fahrenheit|fahrenheit\s*(?:to|->|→|into)\s*(?:degree\s*)?celsius|fahrenheit.*?convert.*?celsius/.test(
          combined
        );
      // Check for explicit celsius -> fahrenheit direction
      const cToF =
        /from\s*(?:degree\s*)?celsius|celsius\s*(?:to|->|→|into)\s*(?:degree\s*)?fahrenheit|celsius.*?convert.*?fahrenheit/.test(
          combined
        );
      if (fToC && !cToF)
        return [
          "fahrenheit_to_celsius",
          "temperature_converter",
          "temperature_calculator",
          "temp_converter",
        ];
      if (cToF && !fToC)
        return [
          "celsius_to_fahrenheit",
          "temperature_converter",
          "temperature_calculator",
          "temp_converter",
        ];
      return [
        "temperature_converter",
        "temperature_calculator",
        "temp_converter",
        "celsius_fahrenheit",
      ];
    }
    if (hasCelsius)
      return [
        "celsius_to_fahrenheit",
        "temperature_converter",
        "temp_converter",
      ];
    if (hasFahrenheit)
      return [
        "fahrenheit_to_celsius",
        "temperature_converter",
        "temp_converter",
      ];
    return ["temperature_converter", "temperature_calculator", "temp_converter"];
  },
};

const NAME_RULES: NameRule[] = [
  {
    matcher: /even.?odd|oddeven|\beven\b|\bodd\b/,
    getNames: () => ["even_odd_checker", "number_parity", "even_odd"],
  },
  {
    matcher: /grade|marks|cgpa|\bscore\b/,
    getNames: () => ["grade_calculator", "student_grade", "marks_calculator"],
  },
  {
    matcher: /fibonacci/,
    getNames: () => ["fibonacci_sequence", "fibonacci_calculator"],
  },
  {
    matcher: /\bprime\b/,
    getNames: () => ["prime_number_checker", "prime_checker"],
  },
  {
    matcher: /factorial/,
    getNames: () => ["factorial_calculator", "factorial"],
  },
  {
    matcher: /palindrome/,
    getNames: () => ["palindrome_checker", "palindrome"],
  },
  {
    matcher: /reverse|revers\w*/,
    getNames: () => ["reverse_string", "string_reverser"],
  },
  {
    matcher: /sum|total|average|mean/,
    getNames: () => ["sum_calculator", "average_calculator", "total_calculator"],
  },
  {
    matcher: /area|perimeter|rectangle|triangle|circle/,
    getNames: () => ["area_calculator", "shape_area_calculator"],
  },
  {
    matcher: /interest|compound/,
    getNames: () => ["interest_calculator", "compound_interest"],
  },
  {
    matcher: /percentage|percent/,
    getNames: () => ["percentage_calculator"],
  },
  {
    matcher: /leap\s*year/,
    getNames: () => ["leap_year_checker"],
  },
];
/** Extracts the names of top-level `def` statements from Python code. */
export function extractFunctionNames(code: string): string[] {
  const names: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = FUNCTION_RE.exec(code)) !== null) {
    names.push(match[1]);
  }
  return names.slice(0, 3);
}

/** Strips a leading verb prefix such as `check_` from a snake_case name. */
export function stripVerbPrefix(name: string): string {
  for (const prefix of VERB_PREFIXES) {
    if (name.startsWith(prefix) && name.length > prefix.length) {
      return name.slice(prefix.length);
    }
  }
  return name;
}
/** Builds file-name suggestions derived from the user's function names. */
export function functionDerivedNames(src: string): string[] {
  const names: string[] = [];
  for (const fnName of extractFunctionNames(src)) {
    if (!PEP8_NAME_RE.test(`${fnName}.py`)) continue;

    names.push(`${fnName}.py`);
    if (names.length >= MAX_SUGGESTIONS) break;

    const stripped = stripVerbPrefix(fnName);
    if (
      stripped !== fnName &&
      !GENERIC_BASES.has(stripped) &&
      PEP8_NAME_RE.test(`${stripped}.py`)
    ) {
      names.push(`${stripped}.py`);
      if (names.length >= MAX_SUGGESTIONS) break;
    }
  }
  return names;
}

/**
 * Returns 3-5 PEP 8 compliant (lower_snake_case.py) suggested file names in
 * priority order:
 *   1. keyword matches from the problem statement / inputs / outputs
 *   2. names derived from the user's function definitions
 *   3. generic fallbacks (main.py, solution.py, program.py)
 */
export function suggestFileNames(
  problemStatement: string,
  pythonCode: string,
  inputs: string[] = [],
  outputs: string[] = []
): string[] {
  const combined = `${problemStatement} ${inputs.join(" ")} ${outputs.join(" ")}`
    .toLowerCase()
    .replace(/\s+/g, " ");

  // 1. Keyword rule (first match wins) — append .py to base names.
  const keywordNames: string[] = [];
  if (temperatureRule.matcher.test(combined)) {
    keywordNames.push(...temperatureRule.getNames(combined).map((n) => `${n}.py`));
  } else {
    for (const rule of NAME_RULES) {
      if (rule.matcher.test(combined)) {
        keywordNames.push(...rule.getNames(combined).map((n) => `${n}.py`));
        break;
      }
    }
  }

  // 2. Function-name derived names.
  const functionNames = functionDerivedNames(pythonCode);

  // 3. Dedupe + validate; fallbacks only used if keyword+function names < MIN_SUGGESTIONS.
  const seen = new Set<string>();
  const result: string[] = [];
  for (const name of [...keywordNames, ...functionNames]) {
    if (name.length > MAX_NAME_LENGTH) continue;
    if (!PEP8_NAME_RE.test(name)) continue;
    if (seen.has(name)) continue;
    seen.add(name);
    result.push(name);
    if (result.length >= MAX_SUGGESTIONS) break;
  }

  // Only add fallbacks if we don't have enough keyword/function-based names
  if (result.length < MIN_SUGGESTIONS) {
    for (const name of FALLBACK_NAMES) {
      if (seen.has(name)) continue;
      seen.add(name);
      result.push(name);
      if (result.length >= MIN_SUGGESTIONS) break;
    }
  }

  return result;
}