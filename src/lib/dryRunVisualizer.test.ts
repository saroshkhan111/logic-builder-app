import { describe, expect, it } from "vitest";

import {
  traceExecution,
  formatDryRun,
  type DryRunResult,
  type DryRunStep,
} from "./dryRunVisualizer";

describe("traceExecution", () => {
  it("traces simple variable assignments", () => {
    const code = `x = 5\ny = 10\nz = x + y`;
    const result = traceExecution(code);

    expect(result.steps.length).toBe(3);
    expect(result.hasError).toBe(false);

    // First step: x = 5
    expect(result.steps[0].type).toBe("assignment");
    expect(result.steps[0].variablesChanged).toEqual({ x: "5" });
    expect(result.steps[0].explanation).toContain("x");

    // Third step: z = x + y
    expect(result.steps[2].type).toBe("assignment");
    expect(result.steps[2].variablesChanged).toEqual({ z: "15" });

    // Final scope
    expect(result.finalScope).toEqual({ x: "5", y: "10", z: "15" });
  });

  it("traces arithmetic operations correctly", () => {
    const code = `a = 20\nb = 3\nc = a * b\nd = a / b`;
    const result = traceExecution(code);

    expect(result.finalScope.c).toBe("60");
    expect(result.finalScope.d).toBeCloseTo(6.6667, 1);
  });

  it("traces string concatenation", () => {
    const code = `first = "Hello"\nsecond = " World"\nfull = first + second`;
    const result = traceExecution(code);

    expect(result.finalScope.full).toBe('"Hello World"');
  });

  it("traces function definitions", () => {
    const code = `def add(a, b):\n    result = a + b\n    return result`;
    const result = traceExecution(code);

    expect(result.steps[0].type).toBe("function_def");
    expect(result.steps[0].explanation).toContain("add");
    expect(result.steps[0].explanation).toContain("a");
    expect(result.steps[0].explanation).toContain("b");
  });

  it("traces return statements", () => {
    const code = `def greet(name):\n    return "Hello " + name`;
    const result = traceExecution(code);

    const returnStep = result.steps.find((s) => s.type === "return");
    expect(returnStep).toBeDefined();
    expect(returnStep?.returnValue).toBeDefined();
  });

  it("traces print statements", () => {
    const code = `x = 42\nprint(x)`;
    const result = traceExecution(code);

    const printStep = result.steps.find((s) => s.type === "print");
    expect(printStep).toBeDefined();
    expect(printStep?.output).toBe("42");
    expect(printStep?.explanation).toContain("Print");
  });

  it("traces augmented assignment (+=)", () => {
    const code = `count = 0\ncount += 5\ncount += 3`;
    const result = traceExecution(code);

    expect(result.finalScope.count).toBe("8");
  });

  it("traces control flow statements", () => {
    const code = `x = 10\nif x > 5:\n    y = 20`;
    const result = traceExecution(code);

    const controlStep = result.steps.find((s) => s.type === "control_flow");
    expect(controlStep).toBeDefined();
    expect(controlStep?.explanation).toContain("Control flow");
  });

  it("skips blank lines and comments in output", () => {
    const code = `x = 5\n\n# This is a comment\ny = 10`;
    const result = traceExecution(code);

    // Blank lines should be filtered out
    expect(result.steps.every((s) => s.type !== "blank")).toBe(true);
    // Comments should be included but marked as comment type
    const commentStep = result.steps.find((s) => s.type === "comment");
    expect(commentStep).toBeDefined();
  });

  it("tracks scope correctly across steps", () => {
    const code = `a = 5\nb = a + 3\nc = a + b`;
    const result = traceExecution(code);

    // After first step, scope has: { a: "5" }
    expect(result.steps[0].scope).toEqual({ a: "5" });

    // After second step, scope has: { a: "5", b: "8" }
    expect(result.steps[1].scope).toEqual({ a: "5", b: "8" });

    // After third step, scope has all three
    expect(result.steps[2].scope).toEqual({ a: "5", b: "8", c: "13" });
  });

  it("handles the example from the spec: add function", () => {
    const code = `def add(a, b):\n    result = a + b\n    return result\n\nx = add(4, 3)\nprint(x)`;
    const result = traceExecution(code);

    expect(result.totalSteps).toBeGreaterThanOrEqual(5);
    expect(result.steps.some((s) => s.type === "function_def")).toBe(true);
    expect(result.steps.some((s) => s.type === "return")).toBe(true);
    expect(result.steps.some((s) => s.type === "print")).toBe(true);
  });

  it("handles empty code", () => {
    const result = traceExecution("");

    expect(result.steps.length).toBe(0);
    expect(result.totalSteps).toBe(0);
    expect(result.hasError).toBe(false);
    expect(result.finalScope).toEqual({});
  });

  it("handles variable reassignment", () => {
    const code = `x = 5\nx = 10\nx = x + 1`;
    const result = traceExecution(code);

    expect(result.finalScope.x).toBe("11");
    expect(result.steps.length).toBe(3);
  });
});

describe("formatDryRun", () => {
  it("formats a simple trace into readable output", () => {
    const code = `x = 5\ny = 10\nprint(x + y)`;
    const result = traceExecution(code);
    const formatted = formatDryRun(result);

    expect(formatted).toContain("DRY RUN");
    expect(formatted).toContain("Line 1: x = 5");
    expect(formatted).toContain("Line 2: y = 10");
    expect(formatted).toContain("Final Variables");
    expect(formatted).toContain("x = 5");
    expect(formatted).toContain("y = 10");
  });

  it("includes output markers for print steps", () => {
    const code = `name = "Alice"\nprint(name)`;
    const result = traceExecution(code);
    const formatted = formatDryRun(result);

    expect(formatted).toContain("Output:");
  });

  it("includes return markers for return steps", () => {
    const code = `def double(n):\n    return n * 2`;
    const result = traceExecution(code);
    const formatted = formatDryRun(result);

    expect(formatted).toContain("Returns:");
  });
});
