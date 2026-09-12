import { describe, it, expect, vi } from "vitest";

import { runSmartPythonCode } from "@/lib/pyodide/runner";

import {
  parseCondition,
  detectProblemType,
  detectInputType,
  generateValuesForInput,
  generateTestCases,
  isHardcodedCode,
  HARDCODED_CODE_WARNING,
  type ParsedCondition,
} from "./smartTestGenerator";

// Mock the runner module
vi.mock("@/lib/pyodide/runner", () => ({
  runSmartPythonCode: vi.fn(),
}));

describe("parseCondition", () => {
  it("parses 'must be > N' correctly", () => {
    const result = parseCondition("age must be > 0");
    expect(result).toEqual({ field: "age", operator: ">", value: 0 });
  });

  it("parses 'must be greater than N' correctly", () => {
    const result = parseCondition("score must be greater than 50");
    expect(result).toEqual({ field: "score", operator: ">", value: 50 });
  });

  it("parses 'must be >= N' correctly", () => {
    const result = parseCondition("age must be >= 18");
    expect(result).toEqual({ field: "age", operator: ">=", value: 18 });
  });

  it("parses 'must be at least N' correctly", () => {
    const result = parseCondition("marks must be at least 40");
    expect(result).toEqual({ field: "marks", operator: ">=", value: 40 });
  });

  it("parses 'must be < N' correctly", () => {
    const result = parseCondition("temp must be < 100");
    expect(result).toEqual({ field: "temp", operator: "<", value: 100 });
  });

  it("parses 'must be <= N' correctly", () => {
    const result = parseCondition("age must be <= 65");
    expect(result).toEqual({ field: "age", operator: "<=", value: 65 });
  });

  it("parses 'must be between X and Y' correctly", () => {
    const result = parseCondition("score must be between 0 and 100");
    expect(result).toEqual({
      field: "score",
      operator: "between",
      value: 0,
      value2: 100,
    });
  });

  it("parses 'must be between X to Y' correctly", () => {
    const result = parseCondition("age must be between 18 to 65");
    expect(result).toEqual({
      field: "age",
      operator: "between",
      value: 18,
      value2: 65,
    });
  });

  it("parses 'must be positive' correctly", () => {
    const result = parseCondition("number must be positive");
    expect(result).toEqual({ field: "number", operator: "positive", value: 0 });
  });

  it("parses 'must be non-negative' correctly", () => {
    const result = parseCondition("count must be non-negative");
    expect(result).toEqual({
      field: "count",
      operator: "non-negative",
      value: 0,
    });
  });

  it("parses 'must be even' correctly", () => {
    const result = parseCondition("number must be even");
    expect(result).toEqual({ field: "number", operator: "even", value: 0 });
  });

  it("parses 'must be odd' correctly", () => {
    const result = parseCondition("number must be odd");
    expect(result).toEqual({ field: "number", operator: "odd", value: 1 });
  });

  it("returns null for unrecognized rules", () => {
    expect(parseCondition("this is not a rule")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseCondition("")).toBeNull();
  });
});

describe("detectProblemType", () => {
  it("detects temperature from celsius", () => {
    expect(
      detectProblemType(
        "Convert celsius to fahrenheit",
        ["celsius_temp"],
        ["fahrenheit_temp"]
      )
    ).toBe("temperature");
  });

  it("detects temperature from keyword 'fahrenheit'", () => {
    expect(
      detectProblemType("Temperature conversion", ["temp"], ["result"])
    ).toBe("temperature");
  });

  it("detects temperature from 'kelvin'", () => {
    expect(
      detectProblemType("Convert kelvin to celsius", ["kelvin"], ["celsius"])
    ).toBe("temperature");
  });

  it("detects grade from 'grade'", () => {
    expect(
      detectProblemType("Calculate student grade", ["marks"], ["grade"])
    ).toBe("grade");
  });

  it("detects grade from 'score'", () => {
    expect(detectProblemType("Calculate score", ["marks"], ["result"])).toBe(
      "grade"
    );
  });

  it("detects fibonacci", () => {
    expect(detectProblemType("Find fibonacci number", ["n"], ["result"])).toBe(
      "fibonacci"
    );
  });

  it("detects prime", () => {
    expect(detectProblemType("Check if prime", ["number"], ["is_prime"])).toBe(
      "prime"
    );
  });

  it("detects factorial", () => {
    expect(detectProblemType("Calculate factorial", ["n"], ["result"])).toBe(
      "factorial"
    );
  });

  it("detects even-odd", () => {
    expect(detectProblemType("Check even or odd", ["number"], ["result"])).toBe(
      "even-odd"
    );
  });

  it("detects palindrome", () => {
    expect(detectProblemType("Check if palindrome", ["text"], ["result"])).toBe(
      "palindrome"
    );
  });

  it("detects reverse", () => {
    expect(detectProblemType("Reverse a string", ["text"], ["reversed"])).toBe(
      "reverse"
    );
  });

  it("detects aggregation from 'sum'", () => {
    expect(
      detectProblemType("Calculate sum of numbers", ["numbers"], ["total"])
    ).toBe("aggregation");
  });

  it("detects aggregation from 'average'", () => {
    expect(detectProblemType("Find average", ["values"], ["avg"])).toBe(
      "aggregation"
    );
  });

  it("returns generic for unrecognized problems", () => {
    expect(
      detectProblemType("Do something random", ["input"], ["output"])
    ).toBe("generic");
  });

  it("detects from inputs when statement is empty", () => {
    expect(
      detectProblemType(
        "",
        ["celsius_temp (number)"],
        ["fahrenheit_temp (float)"]
      )
    ).toBe("temperature");
  });
});

describe("detectInputType", () => {
  it("detects boolean from 'bool'", () => {
    expect(detectInputType("is_valid (boolean)")).toBe("boolean");
  });

  it("detects boolean from 'flag'", () => {
    expect(detectInputType("flag")).toBe("boolean");
  });

  it("detects boolean from 'is_'/'has_' prefixed names", () => {
    expect(detectInputType("is_valid")).toBe("boolean");
    expect(detectInputType("has_peak")).toBe("boolean");
  });

  it("detects integer", () => {
    expect(detectInputType("count (integer)")).toBe("integer");
  });

  it("detects float", () => {
    expect(detectInputType("price (float)")).toBe("float");
  });

  it("detects number from 'number' keyword", () => {
    expect(detectInputType("age (number)")).toBe("number");
  });

  it("detects number from 'temp' in name", () => {
    expect(detectInputType("celsius_temp")).toBe("number");
  });

  it("detects number from 'distance_km'", () => {
    expect(detectInputType("distance_km")).toBe("number");
  });

  it("detects string from 'name'", () => {
    expect(detectInputType("first_name")).toBe("string");
  });

  it("detects string from 'text'", () => {
    expect(detectInputType("input_text (string)")).toBe("string");
  });

  it("detects list from 'list'", () => {
    expect(detectInputType("numbers (list)")).toBe("list");
  });

  it("detects list from 'array'", () => {
    expect(detectInputType("data_array")).toBe("list");
  });

  it("defaults to string for unknown types", () => {
    expect(detectInputType("something")).toBe("string");
  });
});

describe("generateValuesForInput", () => {
  it("generates temperature values for celsius input", () => {
    const result = generateValuesForInput(
      "celsius_temp (number)",
      [],
      "temperature"
    );
    expect(result.length).toBeGreaterThanOrEqual(4);
    expect(result.some((v) => v.value === "0")).toBe(true);
    expect(result.some((v) => v.value === "100")).toBe(true);
    expect(result.some((v) => v.value === "37")).toBe(true);
    expect(result.some((v) => v.value === "-40")).toBe(true);
  });

  it("generates grade values for marks input", () => {
    const result = generateValuesForInput("marks (number)", [], "grade");
    expect(result.some((v) => v.value === "60")).toBe(true);
    expect(result.some((v) => v.value === "100")).toBe(true);
  });

  it("generates condition-aware values for '> 0' rule", () => {
    const conditions = [
      { field: "", operator: ">", value: 0 },
    ] as ParsedCondition[];
    const result = generateValuesForInput("number", conditions, "generic");
    expect(
      result.some((v) => v.value === "-1" && v.category === "invalid")
    ).toBe(true);
    expect(
      result.some((v) => v.value === "0" && v.category === "boundary")
    ).toBe(true);
    expect(
      result.some((v) => v.value === "1" && v.category === "boundary")
    ).toBe(true);
  });

  it("generates condition-aware values for 'between 0 and 100' rule", () => {
    const conditions = [
      { field: "", operator: "between", value: 0, value2: 100 },
    ] as ParsedCondition[];
    const result = generateValuesForInput("score", conditions, "generic");
    expect(
      result.some((v) => v.value === "-1" && v.category === "invalid")
    ).toBe(true);
    expect(
      result.some((v) => v.value === "0" && v.category === "boundary")
    ).toBe(true);
    expect(
      result.some((v) => v.value === "50" && v.category === "typical")
    ).toBe(true);
    expect(
      result.some((v) => v.value === "100" && v.category === "boundary")
    ).toBe(true);
    expect(
      result.some((v) => v.value === "101" && v.category === "invalid")
    ).toBe(true);
  });

  it("generates default number values for generic problem", () => {
    const result = generateValuesForInput("value (number)", [], "generic");
    expect(result.some((v) => v.value === "0")).toBe(true);
    expect(result.some((v) => v.value === "10")).toBe(true);
    expect(result.some((v) => v.value === "-1")).toBe(true);
  });

  it("generates boolean values", () => {
    const result = generateValuesForInput("is_valid (boolean)", [], "generic");
    expect(result.some((v) => v.value === "True")).toBe(true);
    expect(result.some((v) => v.value === "False")).toBe(true);
  });

  it("generates string values", () => {
    const result = generateValuesForInput("name (string)", [], "generic");
    expect(result.some((v) => v.value === "")).toBe(true);
    expect(result.some((v) => v.value === "hello")).toBe(true);
  });

  it("generates list values", () => {
    const result = generateValuesForInput("items (list)", [], "generic");
    expect(result.some((v) => v.value === "[]")).toBe(true);
    expect(result.some((v) => v.value === "[1,2,3]")).toBe(true);
  });

  it("generates positive condition values", () => {
    const conditions = [
      { field: "", operator: "positive", value: 0 },
    ] as ParsedCondition[];
    const result = generateValuesForInput("num", conditions, "generic");
    expect(
      result.some((v) => v.value === "-1" && v.category === "invalid")
    ).toBe(true);
    expect(
      result.some((v) => v.value === "0" && v.category === "boundary")
    ).toBe(true);
    expect(
      result.some((v) => v.value === "50" && v.category === "typical")
    ).toBe(true);
  });

  it("generates even condition values", () => {
    const conditions = [
      { field: "", operator: "even", value: 0 },
    ] as ParsedCondition[];
    const result = generateValuesForInput("num", conditions, "generic");
    expect(
      result.some((v) => v.value === "3" && v.category === "invalid")
    ).toBe(true);
    expect(
      result.some((v) => v.value === "2" && v.category === "typical")
    ).toBe(true);
  });

  it("generates odd condition values", () => {
    const conditions = [
      { field: "", operator: "odd", value: 1 },
    ] as ParsedCondition[];
    const result = generateValuesForInput("num", conditions, "generic");
    expect(
      result.some((v) => v.value === "2" && v.category === "invalid")
    ).toBe(true);
    expect(
      result.some((v) => v.value === "1" && v.category === "typical")
    ).toBe(true);
  });

  it("matches condition field to input name", () => {
    const conditions = [
      { field: "age", operator: ">=", value: 18 },
    ] as ParsedCondition[];
    const result = generateValuesForInput("age", conditions, "generic");
    expect(
      result.some((v) => v.value === "17" && v.category === "invalid")
    ).toBe(true);
    expect(
      result.some((v) => v.value === "18" && v.category === "boundary")
    ).toBe(true);
  });

  it("generates fibonacci values", () => {
    const result = generateValuesForInput("n (number)", [], "fibonacci");
    expect(result.some((v) => v.value === "0")).toBe(true);
    expect(result.some((v) => v.value === "5")).toBe(true);
    expect(result.some((v) => v.value === "20")).toBe(true);
  });

  it("generates palindrome string values", () => {
    const result = generateValuesForInput("text (string)", [], "palindrome");
    expect(result.some((v) => v.value === "aba")).toBe(true);
    expect(result.some((v) => v.value === "racecar")).toBe(true);
  });
});

describe("generateTestCases", () => {
  beforeEach(() => {
    vi.mocked(runSmartPythonCode).mockReset();
  });

  it("executes the user's code and fills expectedOutput", async () => {
    vi.mocked(runSmartPythonCode).mockResolvedValue({
      output: "32.0",
      error: null,
    });

    const result = await generateTestCases(
      ["celsius_temp (number)"],
      ["fahrenheit_temp (float)"],
      [],
      "Convert celsius to fahrenheit",
      "c = float(input())\nprint(c * 9 / 5 + 32)",
      true
    );

    expect(result.warnings).toEqual([]);
    expect(result.testCases.map((tc) => tc.name)).toEqual([
      "Room Temp (37°C)",
      "Negative (-40°C)",
      "Freezing (0°C)",
      "Boiling (100°C)",
      "Absolute Zero (-273.15°C)",
    ]);
    expect(result.testCases.map((tc) => tc.input)).toEqual([
      "37",
      "-40",
      "0",
      "100",
      "-273.15",
    ]);
    expect(result.testCases.every((tc) => tc.expectedOutput === "32.0")).toBe(
      true
    );
    expect(result.testCases.every((tc) => tc.status === "PENDING")).toBe(true);
    expect(runSmartPythonCode).toHaveBeenCalledTimes(result.testCases.length);
  });

  it("keeps expected empty and warns when code execution fails", async () => {
    vi.mocked(runSmartPythonCode).mockResolvedValue({ output: "", error: "boom" });

    const result = await generateTestCases(
      ["num (number)"],
      ["out"],
      [],
      "",
      "raise ValueError('x')",
      true
    );

    expect(result.testCases.length).toBeGreaterThan(0);
    expect(result.testCases.every((tc) => tc.expectedOutput === "")).toBe(true);
    expect(
      result.warnings.some((w) => w.includes("Could not execute code"))
    ).toBe(true);
  });

  it("does not run code when useCodeOutputAsExpected is disabled", async () => {
    const result = await generateTestCases(
      ["a (number)"],
      ["b"],
      [],
      "",
      "print('x')",
      false
    );

    expect(result.testCases.length).toBeGreaterThan(0);
    expect(result.testCases.every((tc) => tc.expectedOutput === "")).toBe(true);
    expect(runSmartPythonCode).not.toHaveBeenCalled();
  });

  it("returns an empty result when no inputs are provided", async () => {
    const result = await generateTestCases([], [], [], "", "", true);

    expect(result.testCases).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it("generates condition-driven cases for a '> 0' rule", async () => {
    const result = await generateTestCases(
      ["distance_km (float)"],
      ["total_fare (float)"],
      ["distance_km must be > 0"],
      "Build a ride-hailing fare calculator",
      "",
      true
    );

    expect(result.testCases.map((tc) => tc.name)).toEqual([
      "Typical (50)",
      "Invalid: below minimum (-1)",
      "Boundary: minimum (0)",
      "Boundary: just above (1)",
      "Edge: large (1000)",
    ]);
  });

  it("varies each input independently for multi-input problems", async () => {
    vi.mocked(runSmartPythonCode).mockResolvedValue({ output: "", error: null });

    const result = await generateTestCases(
      ["distance_km (number)", "peak_hour (boolean)"],
      ["fare (number)"],
      ["distance_km must be > 0"],
      "",
      "",
      true
    );

    expect(result.testCases.length).toBeGreaterThanOrEqual(4);
    // every scenario encodes both inputs positionally
    expect(result.testCases.every((tc) => tc.input.includes("\n"))).toBe(true);
    // the boolean input gets its own False case
    expect(result.testCases.some((tc) => tc.input.includes("False"))).toBe(
      true
    );
    // the distance input varies independently
    expect(result.testCases.some((tc) => tc.input.startsWith("1000"))).toBe(
      true
    );
  });

  it("warns when user code is hardcoded (no input() and no params)", async () => {
    vi.mocked(runSmartPythonCode).mockResolvedValue({
      output: "8",
      error: null,
    });

    const result = await generateTestCases(
      ["a (number)", "b (number)"],
      ["sum (number)"],
      [],
      "Add two numbers",
      "a = 5\nb = 3\nprint(a + b)",
      true
    );

    expect(result.warnings).toContain(HARDCODED_CODE_WARNING);
    expect(result.testCases.length).toBeGreaterThan(0);
  });

  it("does not warn for input()-based or parameterized function code", async () => {
    vi.mocked(runSmartPythonCode).mockResolvedValue({
      output: "8",
      error: null,
    });

    const withInput = await generateTestCases(
      ["a (number)"],
      ["out"],
      [],
      "",
      "x = int(input())\nprint(x)",
      true
    );
    expect(withInput.warnings).not.toContain(HARDCODED_CODE_WARNING);

    const withParams = await generateTestCases(
      ["a (number)", "b (number)"],
      ["out"],
      [],
      "",
      "def add(a, b):\n    return a + b\n",
      true
    );
    expect(withParams.warnings).not.toContain(HARDCODED_CODE_WARNING);
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
