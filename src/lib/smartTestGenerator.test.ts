import { describe, it, expect, vi } from "vitest";

import { runSmartPythonCode } from "@/lib/pyodide/runner";

import {
  parseCondition,
  detectProblemType,
  detectInputType,
  generateValuesForType,
  formatValueForCall,
  generateTestCases,
  isHardcodedCode,
  HARDCODED_CODE_WARNING,
} from "./smartTestGenerator";

vi.mock("@/lib/pyodide/runner", () => ({
  runSmartPythonCode: vi.fn(),
}));

describe("parseCondition", () => {
  it("parses '> N'", () => {
    expect(parseCondition("age must be > 0")).toEqual({ field: "age", operator: ">", value: 0 });
  });
  it("parses 'greater than N'", () => {
    expect(parseCondition("score must be greater than 50")).toEqual({ field: "score", operator: ">", value: 50 });
  });
  it("parses '>= N'", () => {
    expect(parseCondition("age must be >= 18")).toEqual({ field: "age", operator: ">=", value: 18 });
  });
  it("parses 'at least N'", () => {
    expect(parseCondition("marks must be at least 40")).toEqual({ field: "marks", operator: ">=", value: 40 });
  });
  it("parses '< N'", () => {
    expect(parseCondition("temp must be < 100")).toEqual({ field: "temp", operator: "<", value: 100 });
  });
  it("parses '<= N'", () => {
    expect(parseCondition("age must be <= 65")).toEqual({ field: "age", operator: "<=", value: 65 });
  });
  it("parses 'between X and Y'", () => {
    expect(parseCondition("score must be between 0 and 100")).toEqual({ field: "score", operator: "between", value: 0, value2: 100 });
  });
  it("parses 'between X to Y'", () => {
    expect(parseCondition("age must be between 18 to 65")).toEqual({ field: "age", operator: "between", value: 18, value2: 65 });
  });
  it("parses 'positive'", () => {
    expect(parseCondition("number must be positive")).toEqual({ field: "number", operator: "positive", value: 0 });
  });
  it("parses 'non-negative'", () => {
    expect(parseCondition("count must be non-negative")).toEqual({ field: "count", operator: "non-negative", value: 0 });
  });
  it("parses 'even'", () => {
    expect(parseCondition("number must be even")).toEqual({ field: "number", operator: "even", value: 0 });
  });
  it("parses 'odd'", () => {
    expect(parseCondition("number must be odd")).toEqual({ field: "number", operator: "odd", value: 1 });
  });
  it("returns null for unrecognized rules", () => {
    expect(parseCondition("this is not a rule")).toBeNull();
  });
  it("returns null for empty string", () => {
    expect(parseCondition("")).toBeNull();
  });
});

describe("detectProblemType", () => {
  it("detects temperature", () => {
    expect(detectProblemType("Convert celsius to fahrenheit", ["celsius_temp"], ["fahrenheit_temp"])).toBe("temperature");
  });
  it("detects grade", () => {
    expect(detectProblemType("Find grade from marks", ["marks"], ["grade"])).toBe("grade");
  });
  it("detects fibonacci", () => {
    expect(detectProblemType("Print fibonacci numbers", ["n"], ["out"])).toBe("fibonacci");
  });
  it("detects prime", () => {
    expect(detectProblemType("Check if number is prime", ["n"], ["out"])).toBe("prime");
  });
  it("detects factorial", () => {
    expect(detectProblemType("Calculate factorial", ["n"], ["result"])).toBe("factorial");
  });
  it("detects even-odd", () => {
    expect(detectProblemType("Check even or odd", ["number"], ["result"])).toBe("even-odd");
  });
  it("detects palindrome", () => {
    expect(detectProblemType("Check if string is palindrome", ["s"], ["out"])).toBe("palindrome");
  });
  it("detects reverse", () => {
    expect(detectProblemType("Reverse a string", ["text"], ["reversed"])).toBe("reverse");
  });
  it("detects aggregation", () => {
    expect(detectProblemType("Find sum of numbers", ["nums"], ["total"])).toBe("aggregation");
  });
  it("returns generic for unmatched input", () => {
    expect(detectProblemType("Do something random", ["a"], ["b"])).toBe("generic");
  });
});

describe("detectInputType", () => {
  it("detects list-of-integers", () => {
    expect(detectInputType("numbers (list of integers)")).toBe("list-of-integers");
    expect(detectInputType("arr (array of int)")).toBe("list-of-integers");
  });
  it("detects list-of-floats", () => {
    expect(detectInputType("data (list of floats)")).toBe("list-of-floats");
  });
  it("detects list-of-strings", () => {
    expect(detectInputType("words (list of strings)")).toBe("list-of-strings");
  });
  it("detects generic list as list-of-integers", () => {
    expect(detectInputType("arr (list)")).toBe("list-of-integers");
  });
  it("detects matrix", () => {
    expect(detectInputType("grid (matrix)")).toBe("matrix");
    expect(detectInputType("grid (2d array)")).toBe("matrix");
  });
  it("detects dictionary", () => {
    expect(detectInputType("lookup (dict)")).toBe("dictionary");
    expect(detectInputType("cache (map)")).toBe("dictionary");
  });
  it("detects boolean", () => {
    expect(detectInputType("flag (bool)")).toBe("boolean");
    expect(detectInputType("is_valid")).toBe("boolean");
    expect(detectInputType("has_value")).toBe("boolean");
  });
  it("detects string", () => {
    expect(detectInputType("name (string)")).toBe("string");
    expect(detectInputType("input (text)")).toBe("string");
  });
  it("detects float", () => {
    expect(detectInputType("rate (float)")).toBe("float");
    expect(detectInputType("value (decimal)")).toBe("float");
  });
  it("detects integer", () => {
    expect(detectInputType("age (integer)")).toBe("integer");
    expect(detectInputType("count (number)")).toBe("integer");
  });
  it("detects unknown type", () => {
    expect(detectInputType("xyz")).toBe("unknown");
  });
describe("generateValuesForType", () => {
  it("generates integer values including boundaries", () => {
    const values = generateValuesForType("integer", ["age must be >= 0"], "age");
    expect(values).toContain(0);
    expect(values).toContain(-1);
    expect(values).toContain(10);
  });
  it("generates float values", () => {
    const values = generateValuesForType("float", [], "rate");
    expect(values).toContain(0);
    expect(values).toContain(1.5);
  });
  it("generates boolean values", () => {
    const values = generateValuesForType("boolean", [], "flag");
    expect(values).toEqual(expect.arrayContaining([true, false]));
  });
  it("generates string values", () => {
    const values = generateValuesForType("string", [], "name");
    expect(values).toContain("");
    expect(values).toContain("hello");
    expect(values.length).toBeGreaterThanOrEqual(5);
  });
  it("generates list-of-integers values", () => {
    const values = generateValuesForType("list-of-integers", [], "arr");
    expect(values.some((v) => Array.isArray(v) && v.length === 0)).toBe(true);
    expect(values.some((v) => Array.isArray(v) && v.length > 0)).toBe(true);
  });
  it("generates matrix values", () => {
    const values = generateValuesForType("matrix", [], "grid");
    expect(values.length).toBeGreaterThan(0);
    expect(values.every((v) => Array.isArray(v))).toBe(true);
  });
  it("generates dictionary values", () => {
    const values = generateValuesForType("dictionary", [], "lookup");
    expect(values.some((v) => typeof v === "object" && v !== null && !Array.isArray(v))).toBe(true);
    expect(values.some((v) => Object.keys(v as object).length === 0)).toBe(true);
  });
});

describe("formatValueForCall", () => {
  it("formats strings with quotes", () => {
    expect(formatValueForCall("hello", "string")).toBe('"hello"');
  });
  it("formats booleans for Python", () => {
    expect(formatValueForCall(true, "boolean")).toBe("True");
    expect(formatValueForCall(false, "boolean")).toBe("False");
  });
  it("formats lists as JSON", () => {
    expect(formatValueForCall([1, 2, 3], "list-of-integers")).toBe("[1,2,3]");
  });
  it("formats matrices as JSON", () => {
    expect(formatValueForCall([[1, 2], [3, 4]], "matrix")).toBe("[[1,2],[3,4]]");
  });
  it("formats integers as strings", () => {
    expect(formatValueForCall(42, "integer")).toBe("42");
  });
  it("formats null as None", () => {
    expect(formatValueForCall(null, "integer")).toBe("None");
  });
  it("formats undefined as None", () => {
    expect(formatValueForCall(undefined, "integer")).toBe("None");
  });
});

describe("generateTestCases", () => {
  it("returns empty result when no inputs are provided", async () => {
    const result = await generateTestCases([], [], [], "", "", true);
    expect(result.testCases).toEqual([]);
  });

  it("generates test cases for a single integer input", async () => {
    vi.mocked(runSmartPythonCode).mockResolvedValue({ output: "", error: null });
    const result = await generateTestCases(["n (integer)"], ["result"], [], "", "", true);
    expect(result.testCases.length).toBeGreaterThan(0);
    expect(result.testCases.length).toBeLessThanOrEqual(8);
    result.testCases.forEach((tc) => {
      expect(tc.status).toBe("PENDING");
      expect(tc.source).toBe("auto-generated");
    });
  });

  it("generates test cases for a list input", async () => {
    vi.mocked(runSmartPythonCode).mockResolvedValue({ output: "", error: null });
    const result = await generateTestCases(
      ["arr (list of integers)"], ["sorted"], [], "Sort the array", "", true
    );
    expect(result.testCases.length).toBeGreaterThan(0);
    const names = result.testCases.map((tc) => tc.name);
    expect(names).toContain("Empty list");
    expect(names.some((n) => n.includes("List"))).toBe(true);
  });

  it("generates test cases for boolean input", async () => {
    vi.mocked(runSmartPythonCode).mockResolvedValue({ output: "", error: null });
    const result = await generateTestCases(["is_even (bool)"], ["result"], [], "", "", true);
    expect(result.testCases.length).toBe(2);
    expect(result.testCases.some((tc) => tc.input === "True")).toBe(true);
    expect(result.testCases.some((tc) => tc.input === "False")).toBe(true);
  });

  it("generates test cases for string input", async () => {
    vi.mocked(runSmartPythonCode).mockResolvedValue({ output: "", error: null });
    const result = await generateTestCases(["text (string)"], ["result"], [], "", "", true);
    expect(result.testCases.length).toBeGreaterThan(0);
    const names = result.testCases.map((tc) => tc.name);
    expect(names).toContain("Empty string");
    expect(names.some((n) => n.includes("String"))).toBe(true);
  });

  it("generates test cases for dictionary input", async () => {
    vi.mocked(runSmartPythonCode).mockResolvedValue({ output: "", error: null });
    const result = await generateTestCases(["data (dict)"], ["result"], [], "", "", true);
    expect(result.testCases.length).toBeGreaterThan(0);
    expect(result.testCases.some((tc) => tc.input === "{}")).toBe(true);
  });

  it("generates test cases for matrix input", async () => {
    vi.mocked(runSmartPythonCode).mockResolvedValue({ output: "", error: null });
    const result = await generateTestCases(["grid (matrix)"], ["result"], [], "", "", true);
    expect(result.testCases.length).toBeGreaterThan(0);
    expect(result.testCases.some((tc) => tc.input.includes("[[1,2],[3,4]]"))).toBe(true);
  });

  it("runs code to fill expected outputs", async () => {
    vi.mocked(runSmartPythonCode).mockResolvedValue({ output: "42", error: null });
    const result = await generateTestCases(["n (integer)"], ["result"], [], "", "print(n * 2)", true);
    expect(result.testCases.length).toBeGreaterThan(0);
    result.testCases.forEach((tc) => {
      expect(tc.expectedOutput).toBe("42");
    });
  });

  it("does not run code when useCodeOutputAsExpected is disabled", async () => {
    vi.mocked(runSmartPythonCode).mockResolvedValue({ output: "", error: null });
    await generateTestCases(["a (number)"], ["b"], [], "", "print(a)", false);
    expect(runSmartPythonCode).not.toHaveBeenCalled();
  });

  it("warns when user code is hardcoded", async () => {
    vi.mocked(runSmartPythonCode).mockResolvedValue({ output: "8", error: null });
    const result = await generateTestCases(
      ["a (number)", "b (number)"], ["sum (number)"], [], "Add two numbers",
      "a = 5\nb = 3\nprint(a + b)", true
    );
    expect(result.warnings).toContain(HARDCODED_CODE_WARNING);
    expect(result.testCases.length).toBeGreaterThan(0);
  });

  it("does not warn for input()-based or parameterized function code", async () => {
    vi.mocked(runSmartPythonCode).mockResolvedValue({ output: "8", error: null });
    const withInput = await generateTestCases(
      ["a (number)"], ["out"], [], "", "x = int(input())\nprint(x)", true
    );
    expect(withInput.warnings).not.toContain(HARDCODED_CODE_WARNING);
    const withParams = await generateTestCases(
      ["a (number)", "b (number)"], ["out"], [], "", "def add(a, b):\n    return a + b\n", true
    );
    expect(withParams.warnings).not.toContain(HARDCODED_CODE_WARNING);
  });

  it("reports warnings when code execution fails", async () => {
    vi.mocked(runSmartPythonCode).mockResolvedValue({ output: "", error: "boom" });
    const result = await generateTestCases(["num (number)"], ["out"], [], "", "print(num)", true);
    expect(result.warnings).toContain(
      "Could not execute code for some test cases. Fill their expected values manually."
    );
  });
});

describe("isHardcodedCode", () => {
  it("detects literal-only scripts", () => {
    expect(isHardcodedCode("a = 5\nb = 3\nprint(a + b)")).toBe(true);
    expect(isHardcodedCode("print(42)")).toBe(true);
  });
  it("accepts input() and parameterized defs as dynamic", () => {
    expect(isHardcodedCode("n = int(input())\nprint(n)")).toBe(false);
    expect(isHardcodedCode("def add(a, b):\n    return a + b\n")).toBe(false);
    expect(isHardcodedCode("def main(*args):\n    return args\n")).toBe(false);
  });
  it("treats zero-param defs without input() as hardcoded", () => {
    expect(isHardcodedCode("def main():\n    return 42\n")).toBe(true);
  });
  it("returns false for empty code", () => {
    expect(isHardcodedCode("")).toBe(false);
    expect(isHardcodedCode("   ")).toBe(false);
  });
});
});
