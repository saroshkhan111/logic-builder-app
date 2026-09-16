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
 * Type of syntax issue detected. Shared with the AI checker so both paths
 * produce the same shape.
 */
export type IssueType =
  | 'keyword'
  | 'structure'
  | 'indentation'
  | 'spelling'
  | 'case'
  | 'value'
  | 'semantic';

/**
 * A single syntax issue found in the algorithm — written FOR a beginner:
 * a short English title, a plain explanation of what went wrong, a correct
 * example to copy, the learner's own line for context, and (when possible) a
 * one-click fixed line.
 */
export interface SyntaxIssue {
  /** Line number (1-indexed) where issue is found */
  line: number;

  /** Severity of the issue */
  severity: IssueSeverity;

  /** Short English title, e.g. "IF block is not closed" */
  title: string;

  /** Why it is wrong — beginner-friendly English */
  explanation: string;

  /** A correct example the learner can copy */
  example: string;

  /** What the learner actually wrote on that line ("" when not line-specific) */
  originalLine: string;

  /** Suggested corrected line — enables the one-click "Fix Now" button */
  fixedLine?: string;

  /** Machine-readable kind of the issue (shared with the AI checker) */
  type: IssueType;
}

/** Correct-usage example per keyword, shown as the "Correct example" box. */
const KEYWORD_EXAMPLES: Record<string, string> = {
  START: 'START',
  BEGIN: 'BEGIN',
  END: 'END',
  STOP: 'STOP',
  FINISH: 'FINISH',
  INPUT: 'INPUT num',
  READ: 'READ num',
  GET: 'GET num',
  ACCEPT: 'ACCEPT num',
  TAKE: 'TAKE num',
  OUTPUT: 'OUTPUT result',
  PRINT: 'PRINT result',
  DISPLAY: 'DISPLAY result',
  SHOW: 'SHOW result',
  WRITE: 'WRITE result',
  IF: 'IF num > 0 THEN\n  DISPLAY positive\nENDIF',
  THEN: 'IF num > 0 THEN\n  DISPLAY positive\nENDIF',
  ELSE: 'IF num > 0 THEN\n  DISPLAY positive\nELSE\n  DISPLAY negative\nENDIF',
  ELSEIF:
    'IF num > 0 THEN\n  DISPLAY positive\nELSEIF num < 0 THEN\n  DISPLAY negative\nENDIF',
  ENDIF: 'IF num > 0 THEN\n  DISPLAY positive\nENDIF',
  WHILE: 'WHILE count < 10\n  count = count + 1\nENDWHILE',
  ENDWHILE: 'WHILE count < 10\n  count = count + 1\nENDWHILE',
  FOR: 'FOR i = 1 TO 10\n  DISPLAY i\nENDFOR',
  ENDFOR: 'FOR i = 1 TO 10\n  DISPLAY i\nENDFOR',
  REPEAT: 'REPEAT\n  count = count + 1\nUNTIL count >= 10',
  UNTIL: 'REPEAT\n  count = count + 1\nUNTIL count >= 10',
  SET: 'SET total = 0',
  INITIALIZE: 'INITIALIZE total = 0',
  ASSIGN: 'ASSIGN total = 0',
  RETURN: 'RETURN total',
  CALL: 'CALL calculateTotal',
};

/** Closing keyword for each block opener — used in "block not closed" hints. */
const BLOCK_CLOSER_FOR_OPENER: Record<string, string> = {
  IF: 'ENDIF',
  ELSEIF: 'ENDIF',
  WHILE: 'ENDWHILE',
  FOR: 'ENDFOR',
  REPEAT: 'UNTIL',
};

function keywordExample(keyword: string): string {
  return KEYWORD_EXAMPLES[keyword] ?? keyword;
}

/** Builds a SyntaxIssue with the friendly fields beginners actually read. */
function makeIssue(params: {
  line: number;
  severity: IssueSeverity;
  type: IssueType;
  title: string;
  explanation: string;
  example: string;
  originalLine?: string;
  fixedLine?: string;
}): SyntaxIssue {
  const issue: SyntaxIssue = {
    line: params.line,
    severity: params.severity,
    type: params.type,
    title: params.title,
    explanation: params.explanation,
    example: params.example,
    originalLine: params.originalLine ?? '',
  };
  if (params.fixedLine !== undefined) {
    issue.fixedLine = params.fixedLine;
  }
  return issue;
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
  const blockStack: Array<{
    keyword: string;
    lineNumber: number;
    line: string;
  }> = [];

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
      issues.push(
        makeIssue({
          line: lineNumber,
          severity: 'info',
          type: 'case',
          title: 'Write keywords in UPPERCASE',
          explanation: `"${firstWord}" is a valid keyword. Writing pseudocode keywords in UPPERCASE is best practice — it keeps them separate from normal variables.`,
          example: keywordExample(upperFirst),
          originalLine: trimmed,
          fixedLine: content.replace(firstWord, upperFirst),
        })
      );
      return;
    }

    // === CHECK 3: Unknown keyword / Typo detection ===
    if (!isValidKeyword(upperFirst)) {
      const isAssignment = /^[A-Za-z_][A-Za-z0-9_]*\s*[=<>!]/i.test(trimmed);
      const isExpression = /[=<>!+\-*/]/.test(trimmed);

      if (!isAssignment && !isExpression && upperFirst.length >= 3) {
        const closest = findClosestKeyword(upperFirst);
        if (closest) {
          issues.push(
            makeIssue({
              line: lineNumber,
              severity: 'warning',
              type: 'spelling',
              title: `"${firstWord}" is not a keyword`,
              explanation: `"${firstWord}" is not a pseudocode keyword. The spelling may be wrong — did you mean "${closest}"?`,
              example: keywordExample(closest),
              originalLine: trimmed,
              fixedLine: content.replace(firstWord, closest),
            })
          );
        }
      }
    }

    // === CHECK 4: IF without THEN ===
    if (upperFirst === 'IF' || upperFirst === 'ELSEIF') {
      if (!/\bTHEN\b/i.test(trimmed)) {
        issues.push(
          makeIssue({
            line: lineNumber,
            severity: 'error',
            type: 'structure',
            title: `Add THEN after ${upperFirst}`,
            explanation: `${upperFirst} needs THEN after the condition — THEN shows what to do next when the condition is true.`,
            example: `${upperFirst} marks >= 90 THEN\n  DISPLAY "A"\nENDIF`,
            originalLine: trimmed,
            fixedLine: `${content} THEN`,
          })
        );
      }
    }

    // === CHECK 5: Block openers tracking ===
    if (BLOCK_OPENERS.includes(upperFirst)) {
      blockStack.push({ keyword: upperFirst, lineNumber, line: trimmed });
    }

    // === CHECK 6: Block closers matching ===
    // Map each closing keyword to the set of opener keywords it may close.
    const CLOSER_ACCEPTS: Record<string, string[]> = {
      ENDIF: ['IF', 'ELSEIF'],
      ENDWHILE: ['WHILE'],
      ENDFOR: ['FOR'],
      UNTIL: ['REPEAT'],
    };
    const acceptedOpeners = CLOSER_ACCEPTS[upperFirst];
    if (acceptedOpeners) {
      const lastBlock = blockStack.pop();
      if (!lastBlock || !acceptedOpeners.includes(lastBlock.keyword)) {
        const expectedOpener = acceptedOpeners[0];
        issues.push(
          makeIssue({
            line: lineNumber,
            severity: 'error',
            type: 'structure',
            title: `This ${upperFirst} has no matching ${expectedOpener}`,
            explanation: `${upperFirst} closes a ${expectedOpener} block. No open ${expectedOpener} block is above this line — either remove this ${upperFirst}, or write a ${expectedOpener} block before it.`,
            example: keywordExample(expectedOpener),
            originalLine: trimmed,
          })
        );
      }
    }
    // === CHECK 7: DISPLAY/OUTPUT needs a value ===
    if (upperFirst === 'DISPLAY' || upperFirst === 'OUTPUT') {
      const afterKeyword = trimmed.slice(upperFirst.length).trim();
      if (afterKeyword.length === 0) {
        issues.push(
          makeIssue({
            line: lineNumber,
            severity: 'error',
            type: 'value',
            title: `${upperFirst} needs a value to show`,
            explanation: `${upperFirst} shows a value on the screen, but you did not write a value or a variable name. Without a value there is nothing to show.`,
            example: `${upperFirst} result`,
            originalLine: trimmed,
            fixedLine: `${upperFirst} result`,
          })
        );
      }
    }

    // === CHECK 8: INPUT needs a variable ===
    if (upperFirst === 'INPUT' || upperFirst === 'READ') {
      const afterKeyword = trimmed.slice(upperFirst.length).trim();
      if (afterKeyword.length === 0) {
        issues.push(
          makeIssue({
            line: lineNumber,
            severity: 'error',
            type: 'value',
            title: `${upperFirst} needs a variable`,
            explanation: `${upperFirst} reads a value from the user and saves it in a variable. Write a variable name so you can use the saved value later.`,
            example: `${upperFirst} num`,
            originalLine: trimmed,
            fixedLine: `${upperFirst} num`,
          })
        );
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
          issues.push(
            makeIssue({
              line: lineNumber,
              severity: 'warning',
              type: 'indentation',
              title: 'Indent this line by 2 spaces',
              explanation: 'Lines inside IF/ELSE are indented by 2 spaces — this makes it clear that the line belongs to the block.',
              example: 'IF num > 0 THEN\n  DISPLAY positive\nENDIF',
              originalLine: trimmed,
              fixedLine: `  ${content}`,
            })
          );
        }
      }
    }
  });

  // === CHECK 10: Unclosed blocks ===
  if (blockStack.length > 0) {
    blockStack.forEach((block) => {
      const closer = BLOCK_CLOSER_FOR_OPENER[block.keyword] ?? 'ENDIF';
      issues.push(
        makeIssue({
          // Anchor to the line the learner wrote, not to the (missing) closer.
          line: block.lineNumber,
          severity: 'error',
          type: 'structure',
          title: `${block.keyword} block is not closed`,
          explanation: `Line ${block.lineNumber} starts a ${block.keyword} block, but its closing keyword (${closer}) has not appeared yet. Every ${block.keyword} block must end with ${closer}.`,
          example: keywordExample(block.keyword),
          originalLine: block.line,
        })
      );
    });
  }

  // === CHECK 11: START without END ===
  if (hasStart && !hasEnd) {
    issues.push(
      makeIssue({
        line: lines.length,
        severity: 'error',
        type: 'structure',
        title: 'END is missing',
        explanation: 'Your algorithm starts with START but has no END. Every algorithm starts with START and ends with END.',
        example: 'START\nINPUT num\nDISPLAY num\nEND',
      })
    );
  }

  return issues;
}

/**
 * Apply a fix to the algorithm text.
 */
export function applyFix(algorithm: string, issue: SyntaxIssue): string {
  if (!issue.fixedLine) return algorithm;

  const lines = algorithm.split('\n');
  const lineIndex = issue.line - 1;

  if (lineIndex < 0 || lineIndex >= lines.length) return algorithm;

  // Preserve original line number prefix if present
  const originalLine = lines[lineIndex];
  const match = originalLine.match(/^(\s*\d+[.)]\s*)/);
  const prefix = match ? match[1] : '';

  // If fix already has prefix, use as-is; otherwise add prefix
  const fixedContent = issue.fixedLine.startsWith(prefix)
    ? issue.fixedLine
    : prefix + issue.fixedLine;

  lines[lineIndex] = fixedContent;
  return lines.join('\n');
}

