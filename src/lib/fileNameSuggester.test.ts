import { describe, expect, it } from "vitest";

import {
  extractFunctionNames,
  functionDerivedNames,
  stripVerbPrefix,
  suggestFileNames,
} from "./fileNameSuggester";

const PEP8_RE = /^[a-z0-9_]+\.py$/;

describe("suggestFileNames", () => {
  it("suggests even/odd related names for an even/odd problem", () => {
    const names = suggestFileNames(
      "Write a program to check if a number is even or odd.",
      "def check_even_odd(n):\n    return 'even' if n % 2 == 0 else 'odd'\n",
      ["num (int)"],
      ['"even" or "odd"']
    );

    expect(names.length).toBeGreaterThanOrEqual(3);
    expect(names.length).toBeLessThanOrEqual(5);
    expect(names).toContain("even_odd_checker.py");
    expect(names.some((n) => n.includes("parity"))).toBe(true);
    expect(names.some((n) => n.includes("even_odd"))).toBe(true);
  });

  it("suggests temperature converter names for a temperature problem", () => {
    const names = suggestFileNames(
      "Convert temperature from Celsius to Fahrenheit.",
      "",
      ["celsius (float)"],
      ["fahrenheit (float)"]
    );

    expect(names[0]).toBe("celsius_to_fahrenheit.py");
    expect(
      names.every((n) => /temp|celsius|fahrenheit/.test(n))
    ).toBe(true);
  });

  it("respects fahrenheit -> celsius direction when stated", () => {
    const names = suggestFileNames(
      "Given a temperature in Fahrenheit, convert it to Celsius.",
      "",
      [],
      []
    );

    expect(names[0]).toBe("fahrenheit_to_celsius.py");
  });

  it("suggests grade calculator names for a grade problem", () => {
    const names = suggestFileNames(
      "Calculate grade based on marks.",
      "",
      ["marks (float)"],
      ["grade (string)"]
    );

    expect(names).toContain("grade_calculator.py");
    expect(names).toContain("student_grade.py");
  });

  it("suggests fibonacci sequence names for a fibonacci problem", () => {
    const names = suggestFileNames(
      "Print the first n numbers of the fibonacci sequence.",
      "",
      ["n (int)"],
      ["series (list)"]
    );

    expect(names).toContain("fibonacci_sequence.py");
    expect(names).toContain("fibonacci_calculator.py");
  });

  it("extracts function names and suggests check_even_odd.py and even_odd.py", () => {
    const code =
      "def check_even_odd(n):\n    return 'even' if n % 2 == 0 else 'odd'\n";
    expect(extractFunctionNames(code)).toEqual(["check_even_odd"]);
    expect(functionDerivedNames(code)).toContain("check_even_odd.py");
    expect(functionDerivedNames(code)).toContain("even_odd.py");

    const names = suggestFileNames("", code, [], []);
    expect(names).toContain("check_even_odd.py");
    expect(names).toContain("even_odd.py");
  });

  it("does not double-suggest a name that matches both keyword and function", () => {
    const names = suggestFileNames(
      "Check even or odd",
      "def check_even_odd(n):\n    return n % 2\n",
      [],
      []
    );

    expect(names.filter((n) => n === "even_odd.py").length).toBeLessThanOrEqual(
      1
    );
  });

  it("falls back to main/solution/program when nothing matches", () => {
    expect(suggestFileNames("", "", [], [])).toEqual([
      "main.py",
      "solution.py",
      "program.py",
    ]);
  });

  it("returns only 3-5 names and all are PEP 8 compliant", () => {
    const cases = [
      ["Even odd parity checker", "def solve(n):\n    pass\n"],
      ["Convert celsius to fahrenheit", "def convert(c):\n    return c * 9 / 5 + 32\n"],
      ["", "def calculate_fare(d):\n    return d * 10\n"],
    ] as const;

    for (const [problem, code] of cases) {
      const names = suggestFileNames(problem, code, [], []);
      expect(names.length).toBeGreaterThanOrEqual(3);
      expect(names.length).toBeLessThanOrEqual(5);
      for (const name of names) {
        expect(name).toMatch(PEP8_RE);
      }
    }
  });

  it("derives short names by stripping verb prefixes", () => {
    expect(stripVerbPrefix("check_even_odd")).toBe("even_odd");
    expect(stripVerbPrefix("calculate_fare")).toBe("fare");
    expect(stripVerbPrefix("plain_name")).toBe("plain_name");
  });

  it("ignores CamelCase function names that cannot be PEP 8 files", () => {
    const names = suggestFileNames("", "def calculateFare(x):\n    return x\n", [], []);
    expect(names.some((n) => n.includes("calculateFare"))).toBe(false);
  });
});