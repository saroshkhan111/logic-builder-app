import { describe, it, expect } from 'vitest';

import { applyFix, checkAlgorithmSyntax } from './algorithmSyntaxChecker';
import { findClosestKeyword, levenshteinDistance } from './pseudocodeKeywords';

describe('levenshteinDistance', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshteinDistance('IF', 'IF')).toBe(0);
  });

  it('returns correct distance for typos', () => {
    expect(levenshteinDistance('IF', 'IFS')).toBe(1);
    expect(levenshteinDistance('DISPLAY', 'DISPLY')).toBe(1);
    expect(levenshteinDistance('INPUT', 'INPT')).toBe(1);
  });
});

describe('findClosestKeyword', () => {
  it('finds closest for typos', () => {
    expect(findClosestKeyword('DISPLY')).toBe('DISPLAY');
    expect(findClosestKeyword('INPT')).toBe('INPUT');
  });

  it('returns null for far matches', () => {
    expect(findClosestKeyword('XYZABC')).toBeNull();
  });
});

describe('checkAlgorithmSyntax', () => {
  it('returns no issues for valid algorithm', () => {
    const algo = `START
INPUT marks
IF marks >= 90 THEN
  DISPLAY "A"
ELSE
  DISPLAY "F"
ENDIF
END`;
    const issues = checkAlgorithmSyntax(algo);
    expect(issues).toEqual([]);
  });

  it('detects IF without THEN', () => {
    const algo = 'IF marks >= 90\n  DISPLAY "A"';
    const issues = checkAlgorithmSyntax(algo);
    expect(issues.some(i => i.message.includes('missing THEN'))).toBe(true);
  });

  it('detects unknown keyword with suggestion', () => {
    const algo = 'DISPLY result';
    const issues = checkAlgorithmSyntax(algo);
    expect(issues.some(i => i.type === 'spelling')).toBe(true);
  });

  it('detects lowercase keywords', () => {
    const algo = 'input marks';
    const issues = checkAlgorithmSyntax(algo);
    expect(issues.some(i => i.type === 'case')).toBe(true);
  });

  it('detects unclosed IF block', () => {
    const algo = `START
IF marks >= 90 THEN
  DISPLAY "A"
END`;
    const issues = checkAlgorithmSyntax(algo);
    expect(issues.some(i => i.message.includes('not closed'))).toBe(true);
  });

  it('detects START without END', () => {
    const algo = 'START\nDISPLAY "Hello"';
    const issues = checkAlgorithmSyntax(algo);
    expect(issues.some(i => i.message.includes('END is missing'))).toBe(true);
  });

  it('detects indentation issues', () => {
    const algo = 'IF marks >= 90 THEN\nDISPLAY "A"\nENDIF';
    const issues = checkAlgorithmSyntax(algo);
    expect(issues.some(i => i.type === 'indentation')).toBe(true);
  });

  it('detects DISPLAY without value', () => {
    const algo = 'START\nDISPLAY\nEND';
    const issues = checkAlgorithmSyntax(algo);
    expect(issues.some(i => i.message.includes('needs a value'))).toBe(true);
  });

  it('handles multiple issues in one algorithm', () => {
    const algo = `start
if marks >= 90
DISPLY "A"
END`;
    const issues = checkAlgorithmSyntax(algo);
    expect(issues.length).toBeGreaterThan(2);
  });
});

describe('applyFix', () => {
  it('applies simple fix', () => {
    const algo = 'IF marks >= 90';
    const issue = {
      lineNumber: 1,
      severity: 'error' as const,
      message: '',
      suggestion: '',
      fix: 'IF marks >= 90 THEN',
      type: 'structure' as const,
    };
    expect(applyFix(algo, issue)).toBe('IF marks >= 90 THEN');
  });

  it('preserves line number prefix', () => {
    const algo = '1. IF marks >= 90';
    const issue = {
      lineNumber: 1,
      severity: 'error' as const,
      message: '',
      suggestion: '',
      fix: 'IF marks >= 90 THEN',
      type: 'structure' as const,
    };
    expect(applyFix(algo, issue)).toBe('1. IF marks >= 90 THEN');
  });
});
