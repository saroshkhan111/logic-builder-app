import { runSmartPythonCode } from "@/lib/pyodide/runner";
import type { TestSource } from "@/store/logicFlowStore";

// Types

export type ProblemType =
  | "temperature"
  | "grade"
  | "fibonacci"
  | "prime"
  | "factorial"
  | "even-odd"
  | "palindrome"
  | "reverse"
  | "aggregation"
  | "generic";

export type InputType =
  "number" | "integer" | "float" | "string" | "boolean" | "list";

export interface ParsedCondition {
  field: string;
  operator:
    | ">"
    | ">="
    | "<"
    | "<="
    | "between"
    | "positive"
    | "non-negative"
    | "even"
    | "odd";
  value: number;
  value2?: number;
}

export interface InputValue {
  value: string;
  category: "typical" | "boundary" | "edge" | "zero" | "invalid";
  label: string;
}

interface Scenario {
  values: Record<string, string>;
  name: string;
  source: TestSource;
}

export interface SmartTestCase {
  id: string;
  name: string;
  input: string;
  expectedOutput: string;
  status: "PENDING";
  source: TestSource;
}
export interface SmartGenerationResult {
  testCases: SmartTestCase[];
  warnings: string[];
}

/** Warning shown when user code cannot vary by test input. */
export const HARDCODED_CODE_WARNING =
  "Your code doesn't accept inputs. Test cases will show same output. Use a function or input() for dynamic results.";

/**
 * True when the user's code cannot consume test inputs:
 * - no `input()` call
 * - no top-level function with parameters
 *
 * Typical shape: only top-level assignments/prints with literals.
 */
export function isHardcodedCode(code: string): boolean {
  const trimmed = (code ?? "").trim();
  if (!trimmed) return false;

  // Dynamic via stdin
  if (/\binput\s*\(/.test(trimmed)) return false;

  // Dynamic via parameterized function(s)
  const defPattern = /^def\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\(([^)]*)\)\s*:/gm;
  let match: RegExpExecArray | null;
  while ((match = defPattern.exec(trimmed)) !== null) {
    const params = match[1]
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p !== "" && p !== "/")
      .map((p) => p.split("=")[0].trim())
      .filter((p) => p !== "");
    if (params.length > 0) return false;
  }

  return true;
}

// Condition Parsing

export function parseCondition(rule: string): ParsedCondition | null {
  const lower = rule.toLowerCase().trim();

  const betweenMatch = lower.match(
    /must be between (-?\d+\.?\d*)\s*(?:and|to)\s*(-?\d+\.?\d*)/
  );
  if (betweenMatch) {
    return {
      field: extractField(rule),
      operator: "between",
      value: parseFloat(betweenMatch[1]),
      value2: parseFloat(betweenMatch[2]),
    };
  }

  const gteMatch = lower.match(
    /must be (>=|greater than or equal to|at least)\s*(-?\d+\.?\d*)/
  );
  if (gteMatch) {
    return {
      field: extractField(rule),
      operator: ">=",
      value: parseFloat(gteMatch[2]),
    };
  }

  const gtMatch = lower.match(
    /must be (>|greater than|more than|above)\s*(-?\d+\.?\d*)/
  );
  if (gtMatch) {
    return {
      field: extractField(rule),
      operator: ">",
      value: parseFloat(gtMatch[2]),
    };
  }

  const lteMatch = lower.match(
    /must be (<=|less than or equal to|at most)\s*(-?\d+\.?\d*)/
  );
  if (lteMatch) {
    return {
      field: extractField(rule),
      operator: "<=",
      value: parseFloat(lteMatch[2]),
    };
  }

  const ltMatch = lower.match(/must be (<|less than|below)\s*(-?\d+\.?\d*)/);
  if (ltMatch) {
    return {
      field: extractField(rule),
      operator: "<",
      value: parseFloat(ltMatch[2]),
    };
  }

  if (/must be positive/.test(lower)) {
    return { field: extractField(rule), operator: "positive", value: 0 };
  }

  if (/must be non-negative|must be non negative/.test(lower)) {
    return { field: extractField(rule), operator: "non-negative", value: 0 };
  }

  if (/must be even/.test(lower)) {
    return { field: extractField(rule), operator: "even", value: 0 };
  }

  if (/must be odd/.test(lower)) {
    return { field: extractField(rule), operator: "odd", value: 1 };
  }

  return null;
}

function extractField(rule: string): string {
  const match = rule.match(/^([a-z_][a-z0-9_]*)\s+(?:must|should|has to)/i);
  return match ? match[1].toLowerCase() : "";
}
// Problem Type Detection

export function detectProblemType(
  problemStatement: string,
  inputs: string[],
  outputs: string[]
): ProblemType {
  const combined =
    `${problemStatement} ${inputs.join(" ")} ${outputs.join(" ")}`.toLowerCase();

  if (/celsius|fahrenheit|kelvin|temperature/.test(combined))
    return "temperature";
  if (/grade|marks|score|cgpa/.test(combined)) return "grade";
  if (/fibonacci/.test(combined)) return "fibonacci";
  if (/prime/.test(combined)) return "prime";
  if (/factorial/.test(combined)) return "factorial";
  if (/even|odd/.test(combined)) return "even-odd";
  if (/palindrome/.test(combined)) return "palindrome";
  if (/reverse/.test(combined)) return "reverse";
  if (/sum|total|average|mean/.test(combined)) return "aggregation";

  return "generic";
}

// Input Type Detection

export function detectInputType(inputName: string): InputType {
  const lower = inputName.toLowerCase();

  if (/bool|flag/.test(lower)) return "boolean";
  if (/^(is|has|can|should)_/.test(lower)) return "boolean";
  if (/list|array/.test(lower)) return "list";
  if (/int|integer/.test(lower)) return "integer";
  if (/float|decimal/.test(lower)) return "float";
  if (
    /number|num|digit|count|age|year|temp|grade|score|marks|price|distance|height|width|weight|radius/.test(
      lower
    )
  )
    return "number";
  if (/string|str|text|name|word|char/.test(lower)) return "string";
  if (/(_num|_count|_age|_year|_temp|_km|_m|_cm|_kg)$/.test(lower))
    return "number";

  return "string";
}
// Value Generation

export function generateValuesForInput(
  inputName: string,
  conditions: ParsedCondition[],
  problemType: ProblemType
): InputValue[] {
  const inputType = detectInputType(inputName);
  const inputKey = inputName.toLowerCase().replace(/\s*\(.*\)\s*/, "");

  const condition = conditions.find(
    (c) =>
      inputKey.includes(c.field) || c.field.includes(inputKey) || c.field === ""
  );

  if (condition) {
    return generateConditionValues(condition, inputName, inputType);
  }

  if (problemType !== "generic") {
    const templateValues = getProblemTypeValues(problemType, inputType);
    if (templateValues.length > 0) return templateValues;
  }

  return getDefaultValues(inputType, inputName);
}

function generateConditionValues(
  condition: ParsedCondition,
  inputName: string,
  inputType: InputType
): InputValue[] {
  const vals: InputValue[] = [];
  const op = condition.operator;
  const v = condition.value;

  if (op === "between" && condition.value2 !== undefined) {
    const min = Math.min(v, condition.value2);
    const max = Math.max(v, condition.value2);
    const mid = Math.round(((min + max) / 2) * 100) / 100;
    vals.push({
      value: String(min - 1),
      category: "invalid",
      label: `Invalid: below range (${min - 1})`,
    });
    vals.push({
      value: String(min),
      category: "boundary",
      label: `Boundary: minimum (${min})`,
    });
    vals.push({
      value: String(mid),
      category: "typical",
      label: `Typical (${mid})`,
    });
    vals.push({
      value: String(max),
      category: "boundary",
      label: `Boundary: maximum (${max})`,
    });
    vals.push({
      value: String(max + 1),
      category: "invalid",
      label: `Invalid: above range (${max + 1})`,
    });
    return vals;
  }

  if (op === ">") {
    vals.push({
      value: String(v - 1),
      category: "invalid",
      label: `Invalid: below minimum (${v - 1})`,
    });
    vals.push({
      value: String(v),
      category: "boundary",
      label: `Boundary: minimum (${v})`,
    });
    vals.push({
      value: String(v + 1),
      category: "boundary",
      label: `Boundary: just above (${v + 1})`,
    });
    vals.push({
      value: String(v + 50),
      category: "typical",
      label: `Typical (${v + 50})`,
    });
    vals.push({
      value: String(v + 1000),
      category: "edge",
      label: `Edge: large (${v + 1000})`,
    });
    return vals;
  }

  if (op === ">=") {
    vals.push({
      value: String(v - 1),
      category: "invalid",
      label: `Invalid: below minimum (${v - 1})`,
    });
    vals.push({
      value: String(v),
      category: "boundary",
      label: `Boundary: minimum (${v})`,
    });
    vals.push({
      value: String(v + 1),
      category: "boundary",
      label: `Boundary: just above (${v + 1})`,
    });
    vals.push({
      value: String(v + 50),
      category: "typical",
      label: `Typical (${v + 50})`,
    });
    vals.push({
      value: String(v + 1000),
      category: "edge",
      label: `Edge: large (${v + 1000})`,
    });
    return vals;
  }

  if (op === "<") {
    vals.push({
      value: String(v + 1),
      category: "invalid",
      label: `Invalid: above maximum (${v + 1})`,
    });
    vals.push({
      value: String(v),
      category: "boundary",
      label: `Boundary: maximum (${v})`,
    });
    vals.push({
      value: String(v - 1),
      category: "boundary",
      label: `Boundary: just below (${v - 1})`,
    });
    vals.push({
      value: String(Math.max(0, v - 50)),
      category: "typical",
      label: `Typical (${Math.max(0, v - 50)})`,
    });
    vals.push({
      value: String(v - 1000),
      category: "edge",
      label: `Edge: extreme (${v - 1000})`,
    });
    return vals;
  }

  if (op === "<=") {
    vals.push({
      value: String(v + 1),
      category: "invalid",
      label: `Invalid: above maximum (${v + 1})`,
    });
    vals.push({
      value: String(v),
      category: "boundary",
      label: `Boundary: maximum (${v})`,
    });
    vals.push({
      value: String(v - 1),
      category: "boundary",
      label: `Boundary: just below (${v - 1})`,
    });
    vals.push({
      value: String(Math.max(0, v - 50)),
      category: "typical",
      label: `Typical (${Math.max(0, v - 50)})`,
    });
    vals.push({
      value: String(v - 1000),
      category: "edge",
      label: `Edge: extreme (${v - 1000})`,
    });
    return vals;
  }

  if (op === "positive") {
    vals.push({
      value: "-1",
      category: "invalid",
      label: "Invalid: negative (-1)",
    });
    vals.push({
      value: "0",
      category: "boundary",
      label: "Boundary: zero (0)",
    });
    vals.push({
      value: "1",
      category: "boundary",
      label: "Boundary: just above (1)",
    });
    vals.push({ value: "50", category: "typical", label: "Typical (50)" });
    vals.push({
      value: "10000",
      category: "edge",
      label: "Edge: large (10000)",
    });
    return vals;
  }

  if (op === "non-negative") {
    vals.push({
      value: "-1",
      category: "invalid",
      label: "Invalid: negative (-1)",
    });
    vals.push({
      value: "0",
      category: "boundary",
      label: "Boundary: zero (0)",
    });
    vals.push({
      value: "1",
      category: "boundary",
      label: "Boundary: just above (1)",
    });
    vals.push({ value: "50", category: "typical", label: "Typical (50)" });
    vals.push({
      value: "10000",
      category: "edge",
      label: "Edge: large (10000)",
    });
    return vals;
  }

  if (op === "even") {
    vals.push({ value: "3", category: "invalid", label: "Invalid: odd (3)" });
    vals.push({ value: "2", category: "typical", label: "Even (2)" });
    vals.push({ value: "4", category: "typical", label: "Even (4)" });
    vals.push({
      value: "100",
      category: "edge",
      label: "Edge: large even (100)",
    });
    return vals;
  }

  if (op === "odd") {
    vals.push({ value: "2", category: "invalid", label: "Invalid: even (2)" });
    vals.push({ value: "1", category: "typical", label: "Odd (1)" });
    vals.push({ value: "3", category: "typical", label: "Odd (3)" });
    vals.push({ value: "99", category: "edge", label: "Edge: large odd (99)" });
    return vals;
  }

  return getDefaultValues(inputType, inputName);
}
function getProblemTypeValues(
  problemType: ProblemType,
  inputType: InputType
): InputValue[] {
  switch (problemType) {
    case "temperature":
      if (inputType === "boolean") {
        return [
          { value: "True", category: "typical", label: "True (typical)" },
          { value: "False", category: "boundary", label: "False" },
        ];
      }
      if (inputType === "string") {
        return [
          { value: "celsius", category: "typical", label: "Celsius" },
          { value: "fahrenheit", category: "boundary", label: "Fahrenheit" },
        ];
      }
      return [
        { value: "-40", category: "edge", label: "Negative (-40°C)" },
        { value: "0", category: "boundary", label: "Freezing (0°C)" },
        { value: "37", category: "typical", label: "Room Temp (37°C)" },
        { value: "100", category: "boundary", label: "Boiling (100°C)" },
        {
          value: "-273.15",
          category: "edge",
          label: "Absolute Zero (-273.15°C)",
        },
      ];

    case "grade":
      if (inputType === "boolean") {
        return [
          { value: "True", category: "typical", label: "True (typical)" },
          { value: "False", category: "boundary", label: "False" },
        ];
      }
      return [
        { value: "0", category: "edge", label: "Zero (0)" },
        { value: "45", category: "typical", label: "Below Passing (45)" },
        { value: "59", category: "boundary", label: "Just Below (59)" },
        { value: "60", category: "boundary", label: "Passing Threshold (60)" },
        { value: "75", category: "typical", label: "Good (75)" },
        { value: "90", category: "typical", label: "Excellent (90)" },
        { value: "100", category: "boundary", label: "Maximum (100)" },
      ];

    case "fibonacci":
      return [
        { value: "0", category: "boundary", label: "Zero (0)" },
        { value: "1", category: "boundary", label: "One (1)" },
        { value: "5", category: "typical", label: "Small (5)" },
        { value: "10", category: "typical", label: "Medium (10)" },
        { value: "20", category: "edge", label: "Large (20)" },
      ];

    case "prime":
      return [
        { value: "1", category: "boundary", label: "One (1)" },
        { value: "2", category: "boundary", label: "Two (2)" },
        { value: "3", category: "typical", label: "Small prime (3)" },
        { value: "4", category: "typical", label: "Non-prime (4)" },
        { value: "17", category: "typical", label: "Prime (17)" },
        { value: "100", category: "edge", label: "Large (100)" },
      ];

    case "factorial":
      return [
        { value: "0", category: "boundary", label: "Zero (0)" },
        { value: "1", category: "boundary", label: "One (1)" },
        { value: "5", category: "typical", label: "Small (5)" },
        { value: "10", category: "edge", label: "Large (10)" },
      ];

    case "even-odd":
      return [
        { value: "0", category: "boundary", label: "Zero (0)" },
        { value: "1", category: "boundary", label: "Odd (1)" },
        { value: "2", category: "typical", label: "Even (2)" },
        { value: "3", category: "typical", label: "Odd (3)" },
        { value: "-4", category: "edge", label: "Negative Even (-4)" },
      ];

    case "palindrome":
      return [
        { value: "", category: "zero", label: "Empty String" },
        { value: "a", category: "boundary", label: "Single Char (a)" },
        { value: "aba", category: "typical", label: "Palindrome (aba)" },
        { value: "abc", category: "typical", label: "Non-palindrome (abc)" },
        {
          value: "racecar",
          category: "edge",
          label: "Long Palindrome (racecar)",
        },
      ];

    case "reverse":
      return [
        { value: "", category: "zero", label: "Empty String" },
        { value: "a", category: "boundary", label: "Single Char (a)" },
        { value: "hello", category: "typical", label: "Word (hello)" },
        { value: "racecar", category: "edge", label: "Palindrome (racecar)" },
      ];

    case "aggregation":
      if (inputType === "list") {
        return [
          { value: "[]", category: "zero", label: "Empty List" },
          { value: "[1]", category: "boundary", label: "Single Element ([1])" },
          {
            value: "[1,2,3]",
            category: "typical",
            label: "Small List ([1,2,3])",
          },
          {
            value: "[10,20,30]",
            category: "typical",
            label: "Medium List ([10,20,30])",
          },
        ];
      }
      return [
        { value: "0", category: "boundary", label: "Zero (0)" },
        { value: "1", category: "boundary", label: "One (1)" },
        { value: "5", category: "typical", label: "Small (5)" },
        { value: "10", category: "typical", label: "Medium (10)" },
      ];

    default:
      return [];
  }
}
function getDefaultValues(
  inputType: InputType,
  inputName: string
): InputValue[] {
  const lower = inputName.toLowerCase().replace(/\s*\(.*\)\s*/, "");

  if (/temp|temperature/.test(lower)) {
    return [
      { value: "-40", category: "edge", label: "Negative (-40°C)" },
      { value: "0", category: "boundary", label: "Freezing (0°C)" },
      { value: "37", category: "typical", label: "Room Temp (37°C)" },
      { value: "100", category: "boundary", label: "Boiling (100°C)" },
      {
        value: "-273.15",
        category: "edge",
        label: "Absolute Zero (-273.15°C)",
      },
    ];
  }

  if (/grade|score|marks|cgpa/.test(lower)) {
    return [
      { value: "0", category: "edge", label: "Zero (0)" },
      { value: "50", category: "boundary", label: "Below Passing (50)" },
      { value: "59", category: "boundary", label: "Just Below (59)" },
      { value: "60", category: "boundary", label: "Passing Threshold (60)" },
      { value: "90", category: "typical", label: "Excellent (90)" },
      { value: "100", category: "boundary", label: "Maximum (100)" },
    ];
  }

  if (/\bage\b/.test(lower)) {
    return [
      { value: "0", category: "edge", label: "Newborn (0)" },
      { value: "1", category: "boundary", label: "Infant (1)" },
      { value: "18", category: "boundary", label: "Adult (18)" },
      { value: "65", category: "boundary", label: "Senior (65)" },
      { value: "120", category: "edge", label: "Extreme (120)" },
    ];
  }

  if (/\byear\b/.test(lower)) {
    return [
      { value: "1900", category: "boundary", label: "Past (1900)" },
      { value: "2000", category: "typical", label: "Millennium (2000)" },
      { value: "2024", category: "typical", label: "Current (2024)" },
      { value: "2100", category: "edge", label: "Future (2100)" },
    ];
  }

  switch (inputType) {
    case "number":
    case "float":
      return [
        { value: "0", category: "zero", label: "Zero (0)" },
        { value: "1", category: "boundary", label: "One (1)" },
        { value: "10", category: "typical", label: "Typical (10)" },
        { value: "-1", category: "invalid", label: "Negative (-1)" },
        { value: "100", category: "edge", label: "Large (100)" },
      ];

    case "integer":
      return [
        { value: "0", category: "zero", label: "Zero (0)" },
        { value: "1", category: "boundary", label: "One (1)" },
        { value: "5", category: "typical", label: "Typical (5)" },
        { value: "10", category: "typical", label: "Medium (10)" },
        { value: "-1", category: "invalid", label: "Negative (-1)" },
      ];

    case "string":
      return [
        { value: "", category: "zero", label: "Empty String" },
        { value: "a", category: "boundary", label: "Single Char (a)" },
        { value: "hello", category: "typical", label: "Word (hello)" },
        { value: "Test123", category: "edge", label: "Alphanumeric (Test123)" },
      ];

    case "boolean":
      return [
        { value: "True", category: "typical", label: "True" },
        { value: "False", category: "boundary", label: "False" },
      ];

    case "list":
      return [
        { value: "[]", category: "zero", label: "Empty List" },
        { value: "[1]", category: "boundary", label: "Single Element ([1])" },
        {
          value: "[1,2,3]",
          category: "typical",
          label: "Small List ([1,2,3])",
        },
      ];
  }
}
// Scenario Building

function buildScenarios(
  inputs: string[],
  valuesPerInput: InputValue[][],
  problemType: ProblemType
): Scenario[] {
  if (inputs.length === 0) return [];

  const scenarios: Scenario[] = [];

  const typicalIndices = valuesPerInput.map((vals) => {
    const typicalIdx = vals.findIndex((v) => v.category === "typical");
    return typicalIdx >= 0 ? typicalIdx : 0;
  });

  // Typical case - all inputs at typical values
  const typicalValues: Record<string, string> = {};
  inputs.forEach((input, i) => {
    typicalValues[input] = valuesPerInput[i][typicalIndices[i]].value;
  });
  const typicalLabel =
    valuesPerInput[0][typicalIndices[0]].label || "Typical Input";
  scenarios.push({
    values: typicalValues,
    name: typicalLabel,
    source: problemType !== "generic" ? "template" : "auto-generated",
  });

  // Vary one input at a time
  for (let i = 0; i < inputs.length; i++) {
    const inputValues = valuesPerInput[i];

    for (let j = 0; j < inputValues.length; j++) {
      if (j === typicalIndices[i]) continue;

      const val = inputValues[j];
      const scenarioValues: Record<string, string> = {};

      inputs.forEach((input, k) => {
        if (k === i) {
          scenarioValues[input] = val.value;
        } else {
          scenarioValues[input] = valuesPerInput[k][typicalIndices[k]].value;
        }
      });

      const source: TestSource =
        val.category === "invalid"
          ? "invalid"
          : problemType !== "generic"
            ? "template"
            : "auto-generated";

      scenarios.push({
        values: scenarioValues,
        name: val.label,
        source,
      });

      if (scenarios.length >= 8) return scenarios;
    }
  }

  return scenarios;
}
// Main Generator Function

export async function generateTestCases(
  inputs: string[],
  outputs: string[],
  rules: string[],
  problemStatement: string,
  pythonCode: string,
  useCodeOutputAsExpected: boolean = true
): Promise<SmartGenerationResult> {
  if (inputs.length === 0) return { testCases: [], warnings: [] };

  const problemType = detectProblemType(problemStatement, inputs, outputs);

  const conditions = rules
    .map((r) => parseCondition(r))
    .filter((c): c is ParsedCondition => c !== null);

  const valuesPerInput = inputs.map((input) =>
    generateValuesForInput(input, conditions, problemType)
  );

  const scenarios = buildScenarios(inputs, valuesPerInput, problemType);

  const testCases: SmartTestCase[] = [];
  let executionFailureCount = 0;
  const baseId = Date.now();

  for (let s = 0; s < scenarios.length; s++) {
    const scenario = scenarios[s];

    const inputForRunner = inputs
      .map((input) => scenario.values[input])
      .join("\n");

    let expectedOutput = "";

    // Expected output must be completely independent per test case. The
    // runner already resets the Python stdout buffer and normalizes the
    // output (see normalizePyOutput), but trim defensively here too.
    if (useCodeOutputAsExpected && pythonCode && pythonCode.trim()) {
      try {
        const result = await runSmartPythonCode(pythonCode, inputForRunner);
        if (!result.error) {
          expectedOutput = result.output.trim();
        } else {
          executionFailureCount += 1;
        }
      } catch {
        // Code execution failed - leave expected empty for manual fill
        executionFailureCount += 1;
      }
    }

    testCases.push({
      id: `tc-auto-${baseId}-${s}`,
      name: scenario.name,
      input: inputForRunner,
      expectedOutput,
      status: "PENDING",
      source: scenario.source,
    });
  }

  const warnings: string[] = [];

  if (pythonCode && pythonCode.trim() && isHardcodedCode(pythonCode)) {
    warnings.push(HARDCODED_CODE_WARNING);
  }

  if (executionFailureCount > 0) {
    warnings.push(
      "Could not execute code for some test cases. Fill their expected values manually."
    );
  }

  return { testCases, warnings };
}
