/**
 * @fileoverview Python code complexity analyzer.
 */

import type { ComplexityMetrics } from "@/types/flow";

export function analyzeCodeComplexity(code: string): ComplexityMetrics {
  const lines = code.split("\n");
  const nonEmptyLines = lines.filter((l) => l.trim() && !l.trim().startsWith("#"));
  const linesOfCode = nonEmptyLines.length;
  const funcRegex = /^\s*def\s+\w+/gm;
  const functions = (code.match(funcRegex) || []).length;
  const commentLines = lines.filter((l) => l.trim().startsWith("#")).length;
  const inlineComments = code.split("\n").filter((l) => l.includes("#") && !l.trim().startsWith("#")).length;
  const comments = commentLines + inlineComments;
  const commentRatio = linesOfCode > 0 ? Math.round((comments / linesOfCode) * 100) : 0;
  const cyclomaticComplexity = calculateCyclomaticComplexity(code);
  const timeComplexity = estimateTimeComplexity(code);
  const spaceComplexity = estimateSpaceComplexity(code);
  const score = calculateQualityScore(linesOfCode, cyclomaticComplexity, commentRatio, functions);
  return { timeComplexity, spaceComplexity, cyclomaticComplexity, linesOfCode, functions, comments, commentRatio, score };
}

function calculateCyclomaticComplexity(code: string): number {
  let complexity = 1;
  const patterns = [/\bif\b/g, /\belif\b/g, /\bfor\b/g, /\bwhile\b/g, /\bexcept\b/g, /\band\b/g, /\bor\b/g, /\bassert\b/g];
  for (const pattern of patterns) {
    const matches = code.match(pattern);
    if (matches) complexity += matches.length;
  }
  return complexity;
}

function estimateTimeComplexity(code: string): string {
  const hasNestedLoops = /for.*:[\s\S]*?for/.test(code) || /while.*:[\s\S]*?while/.test(code);
  const hasSingleLoop = /\bfor\b/.test(code) || /\bwhile\b/.test(code);
  const hasRecursion = detectRecursion(code);
  const hasBinarySearch = /while.*mid.*low.*high|while.*left.*right/.test(code);
  const hasSorting = /\bsorted\b|\.sort\b/.test(code);
  if (hasRecursion && hasNestedLoops) return "O(2^n)";
  if (hasNestedLoops) return "O(n\u00B2)";
  if (hasSorting) return "O(n log n)";
  if (hasBinarySearch) return "O(log n)";
  if (hasSingleLoop) return "O(n)";
  if (hasRecursion) return "O(n)";
  return "O(1)";
}

function estimateSpaceComplexity(code: string): string {
  const hasListComp = /\[.*for.*in.*\]/.test(code);
  const hasDict = /\{.*:.*\}/.test(code) || /\bdict\b/.test(code);
  const has2DArray = /\[\[/.test(code);
  const hasRecursion = detectRecursion(code);
  if (hasRecursion) return "O(n) - call stack";
  if (has2DArray) return "O(n\u00B2)";
  if (hasListComp || hasDict) return "O(n)";
  return "O(1)";
}

function detectRecursion(code: string): boolean {
  const funcMatch = code.match(/def\s+(\w+)\s*\(/);
  if (!funcMatch) return false;
  const funcName = funcMatch[1];
  const funcBody = code.substring(code.indexOf(funcMatch[0]));
  return new RegExp("\\b" + funcName + "\\s*\\(").test(funcBody.substring(funcMatch[0].length));
}

function calculateQualityScore(loc: number, cyclomatic: number, commentRatio: number, functions: number): number {
  let score = 100;
  if (cyclomatic > 10) score -= (cyclomatic - 10) * 3;
  if (cyclomatic > 20) score -= 10;
  if (commentRatio < 5) score -= 10;
  else if (commentRatio < 15) score -= 5;
  else if (commentRatio > 40) score -= 5;
  if (functions >= 2) score += 5;
  if (functions >= 3) score += 5;
  if (loc > 30 && functions === 0) score -= 15;
  if (loc > 50 && functions <= 1) score -= 10;
  return Math.max(0, Math.min(100, score));
}

export function getComplexityColor(complexity: string): string {
  switch (complexity) {
    case "O(1)": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    case "O(log n)": return "text-blue-400 bg-blue-500/10 border-blue-500/20";
    case "O(n)": return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    case "O(n log n)": return "text-orange-400 bg-orange-500/10 border-orange-500/20";
    case "O(n\u00B2)": case "O(2^n)": return "text-rose-400 bg-rose-500/10 border-rose-500/20";
    default: return "text-slate-400 bg-slate-500/10 border-slate-500/20";
  }
}
