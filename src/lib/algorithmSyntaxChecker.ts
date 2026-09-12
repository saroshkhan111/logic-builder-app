import {
  BLOCK_OPENERS,
  findClosestKeyword,
  isValidKeyword,
} from './pseudocodeKeywords';

/**
 * Severity level of a syntax issue.
 */
export type IssueSeverity = 'error' | 'warning' | 'info';

/**
 * Type of syntax issue detected.
 */
export type IssueType =
  | 'keyword'
  | 'structure'
  | 'indentation'
  | 'spelling'
  | 'case'
  | 'value';

/**
 * A single syntax issue found in the algorithm.
 */
export interface SyntaxIssue {
  /** Line number (1-indexed) where issue is found */
  lineNumber: number;

  /** Severity of the issue */
  severity: IssueSeverity;

  /** Human-readable error message */
  message: string;

  /** Suggested fix description */
  suggestion: string;

  /** Optional auto-fix (new line content) */
  fix?: string;

  /** Type of issue */
  type: IssueType;
}

/**
 * Detect a line number prefix (e.g., "1. " or "1) ") in a line.
 * Returns the prefix length and cleaned content.
 */
function stripLineNumber(line: string): { prefixLength: number; content: string } {
  const match = line.match(/^(\s*\d+[.)]\s*)/);
  if (match) {
    return {
      prefixLength: match[1].length,
      content: line.slice(match[1].length),
    };
  }
  return { prefixLength: 0, content: line };
}

/**
 * Get the first word of a line (keyword candidate).
 */
function getFirstWord(content: string): string {
  const trimmed = content.trim();
  const match = trimmed.match(/^([A-Za-z_]+)/);
  return match ? match[1] : '';
}

/**
 * Check indentation consistency.
 * Returns the indent string (spaces/tabs) of a line.
 */
function getIndent(line: string): string {
  const match = line.match(/^(\s*)/);
  return match ? match[1] : '';
}

export function checkAlgorithmSyntax(algorithm: string): SyntaxIssue[] {
  const issues: SyntaxIssue[] = [];
  const lines = algorithm.split('\n');

  // Track block stack for structure validation
  const blockStack: Array<{ keyword: string; lineNumber: number }> = [];

  let hasStart = false;
  let hasEnd = false;

  lines.forEach((rawLine, index) => {
    const lineNumber = index + 1;
    const { content } = stripLineNumber(rawLine);
    const trimmed = content.trim();

    // Skip empty lines
    if (!trimmed) return;

    const firstWord = getFirstWord(trimmed);
    if (!firstWord) return;

    const upperFirst = firstWord.toUpperCase();

    // === CHECK 1: START/END tracking ===
    if (upperFirst === 'START' || upperFirst === 'BEGIN') hasStart = true;
    if (upperFirst === 'END' || upperFirst === 'STOP' || upperFirst === 'FINISH') hasEnd = true;

    // === CHECK 2: Keyword case sensitivity ===
    if (firstWord !== upperFirst && isValidKeyword(firstWord)) {
      issues.push({
        lineNumber,
        severity: 'info',
        message: `Keywords should be UPPERCASE: "${firstWord}" → "${upperFirst}"`,
        suggestion: `Change "${firstWord}" to "${upperFirst}"`,
        fix: content.replace(firstWord, upperFirst),
        type: 'case',
      });
      return;
    }

    // === CHECK 3: Unknown keyword / Typo detection ===
    if (!isValidKeyword(upperFirst)) {
      const isAssignment = /^[A-Za-z_][A-Za-z0-9_]*\s*[=<>!]/i.test(trimmed);
      const isExpression = /[=<>!+\-*/]/.test(trimmed);

      if (!isAssignment && !isExpression && upperFirst.length >= 3) {
        const closest = findClosestKeyword(upperFirst);
        if (closest) {
          issues.push({
            lineNumber,
            severity: 'warning',
            message: `Unknown keyword "${firstWord}". Did you mean "${closest}"?`,
            suggestion: `Replace "${firstWord}" with "${closest}"`,
            fix: content.replace(firstWord, closest),
            type: 'spelling',
          });
        }
      }
    }

    // === CHECK 4: IF without THEN ===
    if (upperFirst === 'IF' || upperFirst === 'ELSEIF') {
      if (!/\bTHEN\b/i.test(trimmed)) {
        issues.push({
          lineNumber,
          severity: 'error',
          message: `${upperFirst} statement missing THEN`,
          suggestion: `Add THEN at the end: "${trimmed} THEN"`,
          fix: `${content} THEN`,
          type: 'structure',
        });
      }
    }

    // === CHECK 5: Block openers tracking ===
    if (BLOCK_OPENERS.includes(upperFirst)) {
      blockStack.push({ keyword: upperFirst, lineNumber });
    }

    // === CHECK 6: Block closers matching ===
    if (upperFirst === 'ENDIF') {
      const lastBlock = blockStack.pop();
      if (!lastBlock || (lastBlock.keyword !== 'IF' && lastBlock.keyword !== 'ELSEIF')) {
        issues.push({
          lineNumber,
          severity: 'error',
          message: 'ENDIF found without matching IF',
          suggestion: 'Remove this ENDIF or add an IF before it',
          type: 'structure',
        });
      }
    }
    // === CHECK 7: DISPLAY/OUTPUT needs a value ===
    if (upperFirst === 'DISPLAY' || upperFirst === 'OUTPUT') {
      const afterKeyword = trimmed.slice(upperFirst.length).trim();
      if (afterKeyword.length === 0) {
        issues.push({
          lineNumber,
          severity: 'error',
          message: `${upperFirst} needs a value to display`,
          suggestion: `Example: ${upperFirst} result`,
          type: 'value',
        });
      }
    }

    // === CHECK 8: INPUT needs a variable ===
    if (upperFirst === 'INPUT' || upperFirst === 'READ') {
      const afterKeyword = trimmed.slice(upperFirst.length).trim();
      if (afterKeyword.length === 0) {
        issues.push({
          lineNumber,
          severity: 'error',
          message: `${upperFirst} needs a variable name`,
          suggestion: `Example: ${upperFirst} marks`,
          type: 'value',
        });
      }
    }

    // === CHECK 9: Indentation for nested statements ===
    const prevLine = lines[index - 1];
    if (prevLine) {
      const prevTrimmed = stripLineNumber(prevLine).content.trim();
      const prevFirst = getFirstWord(prevTrimmed).toUpperCase();

      if (
        (prevFirst === 'THEN' || prevFirst === 'IF' || prevFirst === 'ELSE') &&
        !prevTrimmed.endsWith('ENDIF')
      ) {
        const indent = getIndent(content);
        if (indent.length === 0 && upperFirst !== 'ELSE' && upperFirst !== 'ENDIF') {
          issues.push({
            lineNumber,
            severity: 'warning',
            message: 'Line should be indented (2 spaces)',
            suggestion: 'Add 2 spaces at the beginning',
            fix: `  ${content}`,
            type: 'indentation',
          });
        }
      }
    }
  });

  // === CHECK 10: Unclosed blocks ===
  if (blockStack.length > 0) {
    blockStack.forEach((block) => {
      issues.push({
        lineNumber: lines.length,
        severity: 'error',
        message: `${block.keyword} at line ${block.lineNumber} is not closed`,
        suggestion: `Add ENDIF at the end`,
        type: 'structure',
      });
    });
  }

  // === CHECK 11: START without END ===
  if (hasStart && !hasEnd) {
    issues.push({
      lineNumber: lines.length,
      severity: 'error',
      message: 'START found but END is missing',
      suggestion: 'Add END at the bottom',
      type: 'structure',
    });
  }

  return issues;
}

/**
 * Apply a fix to the algorithm text.
 */
export function applyFix(algorithm: string, issue: SyntaxIssue): string {
  if (!issue.fix) return algorithm;

  const lines = algorithm.split('\n');
  const lineIndex = issue.lineNumber - 1;

  if (lineIndex < 0 || lineIndex >= lines.length) return algorithm;

  // Preserve original line number prefix if present
  const originalLine = lines[lineIndex];
  const match = originalLine.match(/^(\s*\d+[.)]\s*)/);
  const prefix = match ? match[1] : '';

  // If fix already has prefix, use as-is; otherwise add prefix
  const fixedContent = issue.fix.startsWith(prefix)
    ? issue.fix
    : prefix + issue.fix;

  lines[lineIndex] = fixedContent;
  return lines.join('\n');
}

