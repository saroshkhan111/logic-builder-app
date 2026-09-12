/**
 * Valid pseudocode keywords for Logic Builder.
 * User in keywords ko use karega algorithm likhte waqt.
 */

export const VALID_KEYWORDS = [
  // Structure
  'START', 'END', 'BEGIN', 'STOP', 'FINISH',

  // Input/Output
  'INPUT', 'READ', 'GET', 'ACCEPT', 'TAKE',
  'OUTPUT', 'PRINT', 'DISPLAY', 'SHOW', 'WRITE',

  // Conditions
  'IF', 'THEN', 'ELSE', 'ELSEIF', 'ENDIF',

  // Loops
  'WHILE', 'ENDWHILE', 'FOR', 'ENDFOR', 'REPEAT', 'UNTIL',

  // Assignment
  'SET', 'INITIALIZE', 'ASSIGN',

  // Control
  'RETURN', 'CALL',
] as const;

export type PseudoKeyword = typeof VALID_KEYWORDS[number];

/**
 * Keywords that MUST be UPPERCASE.
 */
export const CASE_SENSITIVE_KEYWORDS = VALID_KEYWORDS;

/**
 * Keywords that need indentation after them (block openers).
 */
export const BLOCK_OPENERS = ['IF', 'ELSEIF', 'WHILE', 'FOR', 'REPEAT'];

/**
 * Keywords that close blocks.
 */
export const BLOCK_CLOSERS = ['ENDIF', 'ENDWHILE', 'ENDFOR', 'UNTIL'];

/**
 * Levenshtein distance calculator for typo detection.
 * Returns edit distance between two strings.
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Find closest valid keyword for a given input.
 * Returns null if no close match (distance > 2).
 */
export function findClosestKeyword(input: string): string | null {
  const upper = input.toUpperCase();
  let closest: string | null = null;
  let minDistance = 3; // Max 2 edits

  for (const keyword of VALID_KEYWORDS) {
    const distance = levenshteinDistance(upper, keyword);
    if (distance < minDistance) {
      minDistance = distance;
      closest = keyword;
    }
  }

  return closest;
}

/**
 * Check if a word is a valid keyword (case-insensitive).
 */
export function isValidKeyword(word: string): boolean {
  return VALID_KEYWORDS.includes(word.toUpperCase() as PseudoKeyword);
}
