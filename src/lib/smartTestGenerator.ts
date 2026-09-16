import { runSmartPythonCode } from "@/lib/pyodide/runner";
import type { TestSource } from "@/store/logicFlowStore";

// Types

export type InputType =
  | "integer"
  | "float"
  | "string"
  | "boolean"
  | "list-of-integers"
  | "list-of-floats"
  | "list-of-strings"
  | "matrix"
  | "dictionary"
  | "unknown";

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

export interface InputSpec {
  name: string;
  type: InputType;
  rawDescription: string;
}

export interface ParsedCondition {
  field: string;
  operator: ">" | ">=" | "<" | "<=" | "between" | "positive" | "non-negative" | "even" | "odd";
  value: number;
  value2?: number;
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

export const HARDCODED_CODE_WARNING =
  "Your code doesn't accept inputs. Test cases will show same output. Use a function or input() for dynamic results.";


export function isHardcodedCode(code: string): boolean {
  const trimmed = (code ?? "").trim();
  if (!trimmed) return false;
  if (/\binput\s*\(/.test(trimmed)) return false;
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

function extractField(rule: string): string {
  const match = rule.match(/^([a-z_][a-z0-9_]*)\s+(?:must|should|has to)/i);
  return match ? match[1].toLowerCase() : "";
}

export function parseCondition(rule: string): ParsedCondition | null {
  const lower = rule.toLowerCase().trim();
  const betweenMatch = lower.match(/must be between (-?\d+\.?\d*)\s*(?:and|to)\s*(-?\d+\.?\d*)/);
  if (betweenMatch) {
    return { field: extractField(rule), operator: "between", value: parseFloat(betweenMatch[1]), value2: parseFloat(betweenMatch[2]) };
  }
  const gteMatch = lower.match(/must be (>=|greater than or equal to|at least)\s*(-?\d+\.?\d*)/);
  if (gteMatch) {
    return { field: extractField(rule), operator: ">=", value: parseFloat(gteMatch[2]) };
  }
  const gtMatch = lower.match(/must be (>|greater than|more than|above)\s*(-?\d+\.?\d*)/);
  if (gtMatch) {
    return { field: extractField(rule), operator: ">", value: parseFloat(gtMatch[2]) };
  }
  const lteMatch = lower.match(/must be (<=|less than or equal to|at most)\s*(-?\d+\.?\d*)/);
  if (lteMatch) {
    return { field: extractField(rule), operator: "<=", value: parseFloat(lteMatch[2]) };
  }
  const ltMatch = lower.match(/must be (<|less than|below)\s*(-?\d+\.?\d*)/);
  if (ltMatch) {
    return { field: extractField(rule), operator: "<", value: parseFloat(ltMatch[2]) };
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


export function detectProblemType(problemStatement: string, inputs: string[], outputs: string[]): ProblemType {
  const combined = `${problemStatement} ${inputs.join(" ")} ${outputs.join(" ")}`.toLowerCase();
  if (/celsius|fahrenheit|kelvin|temperature/.test(combined)) return "temperature";
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

export function detectInputType(description: string): InputType {
  const d = description.toLowerCase();
  if (d.includes("matrix") || d.includes("2d") || d.includes("list of list")) return "matrix";
  if (d.includes("dict") || d.includes("map") || d.includes("hash")) return "dictionary";
  if (d.includes("list of int") || d.includes("array of int")) return "list-of-integers";
  if (d.includes("list of float") || d.includes("array of float")) return "list-of-floats";
  if (d.includes("list of str") || d.includes("array of str")) return "list-of-strings";
  if (d.includes("list") || d.includes("array") || d.includes("[]")) return "list-of-integers";
  if (d.includes("bool") || d.includes("true/false")) return "boolean";
  if (/^(is|has|can|should)_/.test(d)) return "boolean";
  if (d.includes("string") || d.includes("str") || d.includes("text") || d.includes("word")) return "string";
  if (d.includes("float") || d.includes("decimal") || d.includes("double")) return "float";
  if (d.includes("int") || d.includes("number") || d.includes("whole")) return "integer";
  if (/(_num|_count|_age|_year|_temp|_km|_m|_cm|_kg|_price|_distance|_height|_width|_weight|_radius|_score|_marks|_grade)$/.test(d)) return "integer";
  if (/(_name|_text|_word|_char|_str)$/.test(d)) return "string";
  return "unknown";
}

export function generateValuesForType(type: InputType, rules: string[], inputName: string): unknown[] {
  const relevantRules = rules.filter((r) => r.toLowerCase().includes(inputName.toLowerCase()));
  const boundaries = extractBoundaries(relevantRules);
  switch (type) {
    case "integer": {
      const values = new Set<number>();
      values.add(10); values.add(50); values.add(100); values.add(0); values.add(-1);
      boundaries.forEach((b) => { values.add(b.value); values.add(b.value - 1); values.add(b.value + 1); });
      return Array.from(values).filter((v) => Number.isFinite(v));
    }
    case "float": {
      const values = new Set<number>();
      values.add(0.0); values.add(1.5); values.add(10.75); values.add(100.25); values.add(-1.5);
      boundaries.forEach((b) => { values.add(b.value); values.add(b.value + 0.5); });
      return Array.from(values);
    }
    case "string":
      return ["", "a", "hello", "Hello World", "ABC", "123", "a1b2c3", "racecar", "test@123"];
    case "boolean":
      return [true, false];
    case "list-of-integers":
      return [[3,1,2,5,4], [], [5], [1,2,3,4,5], [5,4,3,2,1], [2,2,1,3,3], [100,50,25,75], [-1,-5,0,5]];
    case "list-of-floats":
      return [[1.5,2.5,3.5], [], [5.0], [1.1,2.2,3.3], [3.3,2.2,1.1], [-1.5,0.0,1.5]];
    case "list-of-strings":
      return [["apple","banana","cherry"], [], ["single"], ["zebra","apple","mango"], ["same","same","same"], ["","a","test"]];
    case "matrix":
      return [[[1,2],[3,4]], [[1]], [[1,2,3],[4,5,6]], [[5,5],[5,5]]];
    case "dictionary":
      return [{a:1,b:2}, {}, {key:"value"}, {x:10,y:20,z:30}];
    default:
      return [0, 1, 2];
  }
}

interface Boundary { value: number; operator: string; }
function extractBoundaries(rules: string[]): Boundary[] {
  const boundaries: Boundary[] = [];
  const patterns = [
    /must be\s*>\s*(\d+(?:\.\d+)?)/i, /must be\s*>=\s*(\d+(?:\.\d+)?)/i,
    /must be\s*<\s*(\d+(?:\.\d+)?)/i, /must be\s*<=\s*(\d+(?:\.\d+)?)/i,
    /between\s*(\d+(?:\.\d+)?)\s*and\s*(\d+(?:\.\d+)?)/i,
    /greater than\s*(\d+(?:\.\d+)?)/i, /less than\s*(\d+(?:\.\d+)?)/i,
  ];
  for (const rule of rules) {
    for (const pattern of patterns) {
      const match = rule.match(pattern);
      if (match) {
        boundaries.push({ value: parseFloat(match[1]), operator: ">" });
        if (match[2]) boundaries.push({ value: parseFloat(match[2]), operator: "<" });
      }
    }
  }
  return boundaries;
}


export function formatValueForCall(value: unknown, type: InputType): string {
  if (value === null || value === undefined) return "None";
  switch (type) {
    case "string":
      return `"${String(value).replace(/"/g, '\\"')}"`;
    case "boolean":
      return value ? "True" : "False";
    case "list-of-integers":
    case "list-of-floats":
    case "list-of-strings":
    case "matrix":
    case "dictionary":
      return JSON.stringify(value).replace(/null/g, "None");
    default:
      return String(value);
  }
}

function extractName(description: string): string {
  const match = description.match(/^([a-zA-Z_]\w*)/);
  return match ? match[1] : "input";
}

function makeTestCaseName(value: unknown, _spec: InputSpec, _index: number): string {
  if (Array.isArray(value)) {
    if (value.length === 0) return "Empty list";
    if (value.length === 1) return `Single element [${value[0]}]`;
    const preview = value.slice(0, 3).join(", ");
    return `List [${preview}${value.length > 3 ? ", ..." : ""}]`;
  }
  if (typeof value === "string") {
    return value === "" ? "Empty string" : `String "${value.slice(0, 10)}"`;
  }
  return `Value ${value}`;
}

function makeTestCaseNameMulti(values: unknown[], specs: InputSpec[], _index: number): string {
  return values.map((v, i) => `${specs[i].name}=${JSON.stringify(v)}`).join(", ");
}

function cartesianProduct(arrays: unknown[][]): unknown[][] {
  return arrays.reduce<unknown[][]>(
    (acc, curr) => acc.flatMap((a) => curr.map((c) => [...a, c])),
    [[]]
  );
}

export async function generateTestCases(
  inputs: string[],
  outputs: string[],
  rules: string[],
  _problemStatement: string,
  pythonCode: string,
  useCodeOutputAsExpected: boolean = true
): Promise<SmartGenerationResult> {
  if (inputs.length === 0) return { testCases: [], warnings: [] };

  const inputSpecs: InputSpec[] = inputs.map((raw) => ({
    name: extractName(raw),
    type: detectInputType(raw),
    rawDescription: raw,
  }));

  const valueSets = inputSpecs.map((spec) =>
    generateValuesForType(spec.type, rules, spec.name)
  );

  const maxCases = 8;
  const baseId = Date.now();

  let caseEntries: { values: unknown[]; inputStr: string; name: string }[] = [];

  if (valueSets.length === 1) {
    const values = valueSets[0].slice(0, maxCases);
    caseEntries = values.map((value, i) => ({
      values: [value],
      inputStr: formatValueForCall(value, inputSpecs[0].type),
      name: makeTestCaseName(value, inputSpecs[0], i),
    }));
  } else {
    const combinations = cartesianProduct(valueSets).slice(0, maxCases);
    caseEntries = combinations.map((values, i) => ({
      values,
      inputStr: values.map((v, idx) => formatValueForCall(v, inputSpecs[idx].type)).join("\n"),
      name: makeTestCaseNameMulti(values, inputSpecs, i),
    }));
  }

  const testCases: SmartTestCase[] = [];
  let executionFailureCount = 0;

  for (let i = 0; i < caseEntries.length; i++) {
    const entry = caseEntries[i];
    let expectedOutput = "";

    if (useCodeOutputAsExpected && pythonCode && pythonCode.trim()) {
      try {
        const result = await runSmartPythonCode(pythonCode, entry.inputStr);
        if (!result.error) {
          expectedOutput = result.output.trim();
        } else {
          executionFailureCount += 1;
        }
      } catch {
        executionFailureCount += 1;
      }
    }

    testCases.push({
      id: `tc-auto-${baseId}-${i}`,
      name: entry.name,
      input: entry.inputStr,
      expectedOutput,
      status: "PENDING",
      source: "auto-generated",
    });
  }

  const warnings: string[] = [];
  if (pythonCode && pythonCode.trim() && isHardcodedCode(pythonCode)) {
    warnings.push(HARDCODED_CODE_WARNING);
  }
  if (executionFailureCount > 0) {
    warnings.push("Could not execute code for some test cases. Fill their expected values manually.");
  }
  return { testCases, warnings };
}
