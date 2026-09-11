import { beforeEach, describe, expect, it } from "vitest";

import {
  buildExecutionScript,
  buildFunctionArgs,
  extractTopLevelFunctions,
  isCalledAtTopLevel,
  normalizePyOutput,
  parseInputTokens,
  runSmartPythonCode,
  selectFunctionDef,
} from "@/lib/pyodide/runner";

describe("extractTopLevelFunctions", () => {
  it("finds a single top-level function with its parameters", () => {
    const defs = extractTopLevelFunctions("def add(a, b):\n    return a + b\n");
    expect(defs).toEqual([{ name: "add", params: ["a", "b"] }]);
  });

  it("finds multiple top-level functions in definition order", () => {
    const code =
      "def square(x):\n    return x * x\n\ndef sum_squares(a, b):\n    return square(a) + square(b)\n";
    expect(extractTopLevelFunctions(code).map((d) => d.name)).toEqual([
      "square",
      "sum_squares",
    ]);
  });

  it("ignores indented (nested) defs and comments", () => {
    const code = [
      "# helper comment",
      "def outer():",
      "    def inner(x):",
      "        return x",
      "    return inner",
      "",
      "def main():",
      "    return 42",
    ].join("\n");
    expect(extractTopLevelFunctions(code).map((d) => d.name)).toEqual([
      "outer",
      "main",
    ]);
  });

  it("returns an empty array when there is no function", () => {
    expect(extractTopLevelFunctions("print('hi')")).toEqual([]);
  });
});

describe("selectFunctionDef", () => {
  it("returns null when the code has no functions", () => {
    expect(selectFunctionDef("print('hi')", 0)).toBeNull();
  });

  it("returns the only function", () => {
    expect(
      selectFunctionDef("def add(a, b):\n    return a + b\n", 2)?.name
    ).toBe("add");
  });

  it("prefers 'main' when multiple functions exist", () => {
    const code = "def helper(x):\n    return x\n\ndef main():\n    return helper(1)\n";
    expect(selectFunctionDef(code, 0)?.name).toBe("main");
  });

  it("matches function arity to the number of inputs", () => {
    const code =
      "def square(x):\n    return x * x\n\ndef sum_squares(a, b):\n    return square(a) + square(b)\n";
    expect(selectFunctionDef(code, 2)?.name).toBe("sum_squares");
  });

  it("falls back to the last function when arity does not match", () => {
    const code =
      "def square(x):\n    return x * x\n\ndef sum_squares(a, b):\n    return square(a) + square(b)\n";
    expect(selectFunctionDef(code, 5)?.name).toBe("sum_squares");
  });
});

describe("isCalledAtTopLevel", () => {
  it("ignores recursive calls inside the function body", () => {
    const code =
      "def factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n - 1)\n";
    expect(isCalledAtTopLevel(code, "factorial")).toBe(false);
  });

  it("ignores helper calls made inside other functions", () => {
    const code =
      "def square(x):\n    return x * x\n\ndef sum_squares(a, b):\n    return square(a) + square(b)\n";
    expect(isCalledAtTopLevel(code, "sum_squares")).toBe(false);
  });

  it("detects a top-level print that calls the function", () => {
    const code = "def solve(n):\n    return n * 2\n\nprint(solve(4))\n";
    expect(isCalledAtTopLevel(code, "solve")).toBe(true);
  });

  it("detects a top-level assignment that calls the function", () => {
    const code = "def read_number():\n    return int(input())\n\na = read_number()\n";
    expect(isCalledAtTopLevel(code, "read_number")).toBe(true);
  });

  it("ignores harmless top-level assignments", () => {
    const code = "PI = 3.14\n\ndef area(r):\n    return PI * r * r\n";
    expect(isCalledAtTopLevel(code, "area")).toBe(false);
  });
});
describe("parseInputTokens", () => {
  it("splits newline separated values", () => {
    expect(parseInputTokens("5\n3")).toEqual(["5", "3"]);
  });

  it("splits a comma separated single line", () => {
    expect(parseInputTokens("5, 3")).toEqual(["5", "3"]);
  });

  it("keeps a single bare value as one token", () => {
    expect(parseInputTokens("Alice")).toEqual(["Alice"]);
  });

  it("returns an empty array for empty input", () => {
    expect(parseInputTokens("")).toEqual([]);
    expect(parseInputTokens("   ")).toEqual([]);
  });
});

describe("buildFunctionArgs", () => {
  it("joins multiple values with commas", () => {
    expect(buildFunctionArgs("5\n3")).toBe("5, 3");
  });

  it("quotes bare string values", () => {
    expect(buildFunctionArgs("Alice")).toBe('"Alice"');
  });

  it("keeps numbers and Python literals untouched", () => {
    expect(buildFunctionArgs("3.14\nTrue\nNone")).toBe("3.14, True, None");
  });

  it("returns an empty string for empty input", () => {
    expect(buildFunctionArgs("")).toBe("");
  });
});

describe("buildExecutionScript", () => {
  it("embeds the user code, function call and return fallback in function mode", () => {
    const script = buildExecutionScript(
      "def add(a, b):\n    return a + b\n",
      "add",
      "5, 3"
    );
    expect(script.startsWith("import sys, io")).toBe(true);
    expect(script).toContain("def add(a, b):");
    expect(script).toContain("_result = add(5, 3)");
    expect(script).toContain("print(_result)");
    expect(script).toContain('print(f"ERROR: {e}")');
  });

  it("does not auto-call anything in script mode", () => {
    const script = buildExecutionScript("print('hello')\n", null, "");
    expect(script).toContain("print('hello')");
    expect(script).not.toContain("_result =");
  });
});

describe("normalizePyOutput", () => {
  it("returns the last non-empty line when output leaked/printed multiple lines", () => {
    expect(normalizePyOutput("32.0\n-369.66999999999996")).toBe(
      "-369.66999999999996"
    );
    expect(normalizePyOutput("32.0\r\n-461.46999999999997\r\n")).toBe(
      "-461.46999999999997"
    );
  });

  it("keeps a single line untouched (trimmed)", () => {
    expect(normalizePyOutput("  98.6  ")).toBe("98.6");
  });

  it("keeps the last line for legitimate multi-line output", () => {
    expect(normalizePyOutput("2\n4\n6")).toBe("6");
  });

  it("returns empty string for empty/blank output and non-strings", () => {
    expect(normalizePyOutput("")).toBe("");
    expect(normalizePyOutput("   \n\n ")).toBe("");
    expect(normalizePyOutput(undefined)).toBe("");
    expect(normalizePyOutput(null)).toBe("");
  });
});

describe("runSmartPythonCode", () => {
  const executed: string[] = [];

  beforeEach(() => {
    executed.length = 0;
    (window as unknown as { loadPyodide: unknown }).loadPyodide = async () => ({
      runPythonAsync: async (code: string) => {
        executed.push(code);
        return undefined;
      },
    });
  });

  // The wrapper is the last executed chunk that redirects sys.stdout.
  // Excludes the single-line post-run reset (`sys.stdout = io.StringIO()`).
  const lastWrapper = (): string =>
    [...executed]
      .reverse()
      .find((c) => c.includes("io.StringIO") && c.includes("\n")) ?? "";

  it("calls the selected function with formatted input for return-only code", async () => {
    const result = await runSmartPythonCode(
      "def add(a, b):\n    return a + b\n",
      "5\n3"
    );
    expect(result.error).toBeNull();
    expect(lastWrapper()).toContain("_result = add(5, 3)");
  });

  it("does not pass arguments to zero-param input() based functions", async () => {
    const code = "def main():\n    a = int(input())\n    return a + 1\n";
    const result = await runSmartPythonCode(code, "41");
    expect(result.error).toBeNull();
    expect(lastWrapper()).toContain("_result = main()");
    expect(lastWrapper()).not.toContain("main(41)");
  });

  it("treats code that already invokes the function at top level as a script", async () => {
    const code = "def solve(n):\n    return n * 2\n\nprint(solve(4))\n";
    const result = await runSmartPythonCode(code, "4");
    expect(result.error).toBeNull();
    expect(lastWrapper()).not.toContain("_result = solve(");
  });

  it("runs plain scripts without function detection", async () => {
    const code = "a = int(input())\nb = int(input())\nprint(a + b)\n";
    const result = await runSmartPythonCode(code, "5\n3");
    expect(result.error).toBeNull();
    expect(lastWrapper()).toContain("print(a + b)");
  });
});