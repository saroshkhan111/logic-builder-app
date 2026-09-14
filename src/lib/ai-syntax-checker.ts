/**
 * AI-Powered Universal Syntax Checker using Mistral API (via server-side route).
 *
 * Fallback: Static checker agar API key nahi hai ya API fail ho.
 *
 * Architecture:
 * 1. Client calls /api/analyze (same-origin, no CORS)
 * 2. Server route calls Mistral API (key stays server-side)
 * 3. Result cached client-side for 5 minutes
 */

import type { SyntaxIssue } from './algorithmSyntaxChecker';
import { checkAlgorithmSyntax } from './algorithmSyntaxChecker';

// ============================================================
// TYPES
// ============================================================

export interface AIAnalysisResult {
  issues: SyntaxIssue[];
  overallFeedback: string;
  complexity: 'simple' | 'medium' | 'complex';
  aiAnalyzed: boolean;
  cached?: boolean;
}

// ============================================================
// CONFIGURATION
// ============================================================

const CACHE_TTL_MS = 5 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 15000;

// ============================================================
// CACHE
// ============================================================

interface CacheEntry {
  result: AIAnalysisResult;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

function getCached(algorithm: string): AIAnalysisResult | null {
  const cached = cache.get(algorithm);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    cache.delete(algorithm);
    return null;
  }
  return { ...cached.result, cached: true };
}

function setCache(algorithm: string, result: AIAnalysisResult): void {
  cache.set(algorithm, { result, timestamp: Date.now() });
  if (cache.size > 100) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
}

// ============================================================
// API CALL (via server-side route)
// ============================================================

async function callMistralAPI(algorithm: string): Promise<{
  issues: SyntaxIssue[];
  overallFeedback: string;
  complexity: 'simple' | 'medium' | 'complex';
} | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ algorithm }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // 503 = API key not set on server → fallback
    if (response.status === 503) {
      return null;
    }

    if (!response.ok) {
      console.warn(`AI route error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) return null;

    return parseMistralResponse(content);
  } catch (error) {
    console.warn('AI route exception:', error);
    return null;
  }
}

// ============================================================
// RESPONSE PARSER
// ============================================================

/**
 * Escapes raw control characters (e.g. literal newlines, tabs) that appear
 * inside JSON string values. LLMs frequently emit unescaped newlines inside
 * multi-line "message" / "overallFeedback" strings, and `JSON.parse` rejects
 * any raw control character inside a string literal. Whitespace between JSON
 * tokens is left untouched.
 */
function sanitizeJsonControlChars(input: string): string {
  const escapeMap: Record<string, string> = {
    '\n': '\\n',
    '\r': '\\r',
    '\t': '\\t',
    '\b': '\\b',
    '\f': '\\f',
  };

  let result = '';
  let inString = false;
  let escaped = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (!inString) {
      if (ch === '"') inString = true;
      result += ch;
      continue;
    }

    // Inside a JSON string literal.
    if (escaped) {
      result += ch;
      escaped = false;
      continue;
    }

    if (ch === '\\') {
      result += ch;
      escaped = true;
      continue;
    }

    if (ch === '"') {
      inString = false;
      result += ch;
      continue;
    }

    if (ch.charCodeAt(0) < 0x20) {
      result +=
        escapeMap[ch] ?? `\\u${ch.charCodeAt(0).toString(16).padStart(4, '0')}`;
      continue;
    }

    result += ch;
  }

  return result;
}

function parseMistralResponse(content: string): {
  issues: SyntaxIssue[];
  overallFeedback: string;
  complexity: 'simple' | 'medium' | 'complex';
} | null {
  try {
    let cleaned = content.trim();
    const bt = String.fromCharCode(96);
    const tripleBt = bt + bt + bt;
    if (cleaned.startsWith(tripleBt)) {
      cleaned = cleaned.replace(new RegExp('^' + tripleBt + '(?:json)?\\s*'), '').replace(new RegExp('\\s*' + tripleBt + '$'), '');
    }
    const parsed = JSON.parse(sanitizeJsonControlChars(cleaned));
    if (!Array.isArray(parsed.issues)) return null;

    const validSeverities = new Set(['error', 'warning', 'info']);
    const validTypes = new Set([
      'keyword', 'structure', 'indentation', 'spelling', 'case', 'value', 'semantic',
    ]);

    const issues: SyntaxIssue[] = parsed.issues
      .filter((i: unknown) => {
        if (typeof i !== 'object' || i === null) return false;
        const issue = i as Record<string, unknown>;
        return (
          typeof issue.lineNumber === 'number' &&
          typeof issue.message === 'string' &&
          validSeverities.has(issue.severity as string)
        );
      })
      .map((i: Record<string, unknown>) => ({
        lineNumber: Number(i.lineNumber),
        severity: (i.severity as 'error' | 'warning' | 'info'),
        message: String(i.message),
        suggestion: String(i.suggestion || ''),
        fix: typeof i.fix === 'string' ? i.fix : undefined,
        type: (validTypes.has(i.type as string)
          ? (i.type as SyntaxIssue['type'] || 'structure')
          : 'structure') as SyntaxIssue['type'],
      }));

    const complexity = ['simple', 'medium', 'complex'].includes(parsed.complexity as string)
      ? (parsed.complexity as 'simple' | 'medium' | 'complex')
      : 'simple';

    return {
      issues,
      overallFeedback: String(parsed.overallFeedback || 'Algorithm checked.'),
      complexity,
    };
  } catch {
    return null;
  }
}

// ============================================================
// FALLBACK
// ============================================================

function fallbackToStatic(algorithm: string): AIAnalysisResult {
  const staticIssues = checkAlgorithmSyntax(algorithm);
  return {
    issues: staticIssues,
    overallFeedback: staticIssues.length === 0
      ? '✅ No syntax issues found. Your algorithm looks good!'
      : `Found ${staticIssues.length} issue${staticIssues.length !== 1 ? 's' : ''}. Review them below.`,
    complexity: 'simple',
    aiAnalyzed: false,
  };
}

// ============================================================
// MAIN FUNCTION
// ============================================================

export async function analyzeWithAI(algorithm: string): Promise<AIAnalysisResult> {
  const trimmed = algorithm.trim();
  if (!trimmed) {
    return {
      issues: [],
      overallFeedback: 'Start writing your algorithm to see feedback.',
      complexity: 'simple',
      aiAnalyzed: false,
    };
  }

  // Cache check
  const cached = getCached(algorithm);
  if (cached) return cached;

  // Try AI route (server-side calls Mistral)
  const aiResult = await callMistralAPI(algorithm);

  if (!aiResult) {
    // Fallback to static checker
    const fallback = fallbackToStatic(algorithm);
    setCache(algorithm, fallback);
    return fallback;
  }

  const result: AIAnalysisResult = {
    issues: aiResult.issues,
    overallFeedback: aiResult.overallFeedback,
    complexity: aiResult.complexity,
    aiAnalyzed: true,
  };

  setCache(algorithm, result);
  return result;
}

/** Clears the AI analysis cache. */
export function clearAICache(): void {
  cache.clear();
}
