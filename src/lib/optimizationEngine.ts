/**
 * @fileoverview Optimization suggestions engine.
 */

import type { OptimizationSuggestion, SuggestionSeverity } from "@/types/flow";

export function generateOptimizationSuggestions(code: string): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];
  const lines = code.split("\n");

  checkListComprehension(lines, suggestions);
  checkDictLookup(code, suggestions);
  checkEnumerate(lines, suggestions);
  checkFStrings(lines, suggestions);
  checkTypeHints(lines, suggestions);
  checkStringConcatInLoop(lines, suggestions);

  return suggestions;
}

function checkListComprehension(lines: string[], suggestions: OptimizationSuggestion[]): void {
  const forLoopRegex = /^\s*for\s+\w+\s+in\s+/;
  const appendRegex = /^\s+\w+\.append\(/;

  for (let i = 0; i < lines.length - 1; i++) {
    if (forLoopRegex.test(lines[i]) && appendRegex.test(lines[i + 1])) {
      const match = lines[i + 1].match(/(\w+)\.append\((.+)\)/);
      if (match) {
        suggestions.push({
          id: `list-comp-${i}`,
          severity: "medium",
          title: "Use a list comprehension",
          description: "Use a list comprehension instead of a for-loop with append. The code becomes shorter, cleaner, and faster.",
          originalCode: `${lines[i].trim()}\n    ${lines[i + 1].trim()}`,
          optimizedCode: `${match[1]} = [${match[2]} for ... in ...]`,
          lineNumber: i + 1,
          applied: false,
        });
      }
    }
  }
}

function checkDictLookup(code: string, suggestions: OptimizationSuggestion[]): void {
  const elifCount = (code.match(/\belif\b/g) || []).length;
  if (elifCount >= 2) {
    suggestions.push({
      id: `dict-lookup-${Date.now()}`,
      severity: "medium",
      title: "Try a dict lookup",
      description: `Found ${elifCount + 1} branches. Use a dict lookup instead of an if-elif chain for O(1) fast access.`,
      optimizedCode: "result_map = {cond1: val1, cond2: val2}\nresult = result_map.get(cond, default)",
      applied: false,
    });
  }
}

function checkEnumerate(lines: string[], suggestions: OptimizationSuggestion[]): void {
  const rangeLenRegex = /range\(len\((\w+)\)\)/;
  for (let i = 0; i < lines.length; i++) {
    if (rangeLenRegex.test(lines[i])) {
      suggestions.push({
        id: `enumerate-${i}`,
        severity: "low",
        title: "Use enumerate()",
        description: "Use enumerate() instead of range(len()). It makes the loop cleaner and more readable.",
        originalCode: lines[i].trim(),
        lineNumber: i + 1,
        applied: false,
      });
    }
  }
}

function checkFStrings(lines: string[], suggestions: OptimizationSuggestion[]): void {
  const formatRegex = /\.format\(/;
  const percentRegex = /%\s*[(\"]/;
  for (let i = 0; i < lines.length; i++) {
    if (formatRegex.test(lines[i]) || percentRegex.test(lines[i])) {
      suggestions.push({
        id: `fstring-${i}`,
        severity: "low",
        title: "Use f-strings",
        description: "f-strings are more readable and faster than .format() and % formatting.",
        originalCode: lines[i].trim(),
        lineNumber: i + 1,
        applied: false,
      });
    }
  }
}

function checkTypeHints(lines: string[], suggestions: OptimizationSuggestion[]): void {
  const funcDefRegex = /def\s+(\w+)\s*\(([^)]*)\)/;
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(funcDefRegex);
    if (match) {
      const params = match[2];
      if (params && !params.includes(":")) {
        suggestions.push({
          id: `typehint-${i}`,
          severity: "low",
          title: "Add type hints",
          description: `Function "${match[1]}" is missing type hints. Add annotations.`,
          originalCode: lines[i].trim(),
          lineNumber: i + 1,
          applied: false,
        });
      }
    }
  }
}

function checkStringConcatInLoop(lines: string[], suggestions: OptimizationSuggestion[]): void {
  const concatRegex = /\w+\s*\+=\s*["\']/;
  const inLoop = (idx: number): boolean => {
    for (let i = idx - 1; i >= Math.max(0, idx - 5); i--) {
      if (/^\s*(for|while)\s+/.test(lines[i])) return true;
    }
    return false;
  };

  for (let i = 0; i < lines.length; i++) {
    if (concatRegex.test(lines[i]) && inLoop(i)) {
      suggestions.push({
        id: `str-concat-${i}`,
        severity: "high",
        title: "String concatenation inside a loop",
        description: "Using += in a loop builds a new string on every iteration, which is O(n²). Collect items in a list and use join() instead.",
        originalCode: lines[i].trim(),
        lineNumber: i + 1,
        applied: false,
      });
    }
  }
}

export function getSeverityStyles(severity: SuggestionSeverity): {
  bg: string;
  text: string;
  border: string;
  icon: string;
} {
  switch (severity) {
    case "high":
      return { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20", icon: "\uD83D\uDD34" };
    case "medium":
      return { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", icon: "\uD83D\uDFE1" };
    case "low":
      return { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", icon: "\uD83D\uDFE2" };
  }
}