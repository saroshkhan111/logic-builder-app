import { describe, it, expect } from 'vitest';

import { applyFix, checkAlgorithmSyntax } from './algorithmSyntaxChecker';
import type { SyntaxIssue } from './algorithmSyntaxChecker';
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

  it('detects IF without THEN with the updated title and one-click fix', () => {
    const algo = 'IF marks >= 90\n  DISPLAY "A"';
    const issues = checkAlgorithmSyntax(algo);
    const issue = issues.find((i) => i.type === 'structure');
    expect(issue).toBeDefined();
    expect(issue?.title).toContain('THEN');
    expect(issue?.explanation).toContain('THEN');
    expect(issue?.originalLine).toBe('IF marks >= 90');
    expect(issue?.fixedLine).toBe('IF marks >= 90 THEN');
    expect(issue?.example).toContain('THEN');
  });

  it('detects unknown keyword with suggestion', () => {
    const algo = 'DISPLY result';
    const issues = checkAlgorithmSyntax(algo);
    const issue = issues.find((i) => i.type === 'spelling');
    expect(issue).toBeDefined();
    expect(issue?.title).toContain('DISPLY');
    expect(issue?.explanation).toContain('DISPLAY');
    expect(issue?.example).toContain('DISPLAY');
    expect(issue?.fixedLine).toBe('DISPLAY result');
  });

  it('detects lowercase keywords', () => {
    const algo = 'input marks';
    const issues = checkAlgorithmSyntax(algo);
    const issue = issues.find((i) => i.type === 'case');
    expect(issue).toBeDefined();
    expect(issue?.title.toLowerCase()).toContain('uppercase');
    expect(issue?.example).toBe('INPUT num');
    expect(issue?.fixedLine).toBe('INPUT marks');
  });

  it('anchors unclosed IF block to the opener line', () => {
    const algo = 'START\nIF marks >= 90 THEN\n  DISPLAY "A"\nEND';
    const issues = checkAlgorithmSyntax(algo);
    const issue = issues.find((i) => i.type === 'structure');
    expect(issue).toBeDefined();
    expect(issue?.title).toContain('is not closed');
    expect(issue?.explanation).toContain('ENDIF');
    expect(issue?.line).toBe(2);
    expect(issue?.originalLine).toBe('IF marks >= 90 THEN');
  });

  it('detects START without END', () => {
    const algo = 'START\nDISPLAY "Hello"';
    const issues = checkAlgorithmSyntax(algo);
    const issue = issues.find((i) => i.title.includes('END is missing'));
    expect(issue).toBeDefined();
    expect(issue?.explanation).toContain('START');
    expect(issue?.example).toContain('END');
  });

  it('detects indentation issues', () => {
    const algo = 'IF marks >= 90 THEN\nDISPLAY "A"\nENDIF';
    const issues = checkAlgorithmSyntax(algo);
    const issue = issues.find((i) => i.type === 'indentation');
    expect(issue).toBeDefined();
    expect(issue?.fixedLine).toBe('  DISPLAY "A"');
  });

  it('detects DISPLAY without value with friendly fields', () => {
    const algo = 'START\nDISPLAY\nEND';
    const issues = checkAlgorithmSyntax(algo);
    const issue = issues.find((i) => i.type === 'value');
    expect(issue).toBeDefined();
    expect(issue?.title).toContain('needs a value');
    expect(issue?.originalLine).toBe('DISPLAY');
    expect(issue?.example).toBe('DISPLAY result');
    expect(issue?.fixedLine).toBe('DISPLAY result');
  });

  it('gives every issue an English explanation and example', () => {
    const algo = 'START\nIF num > 0\nDISPLAY\nEND';
    const issues = checkAlgorithmSyntax(algo);
    expect(issues.length).toBeGreaterThan(0);
    for (const issue of issues) {
      expect(issue.title.length).toBeGreaterThan(0);
      expect(issue.explanation.length).toBeGreaterThan(0);
      expect(issue.example.length).toBeGreaterThan(0);
      expect(typeof issue.line).toBe('number');
    }
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
  const baseIssue: SyntaxIssue = {
    line: 1,
    severity: 'error',
    type: 'structure',
    title: 'Add THEN after IF',
    explanation: 'THEN is required here',
    example: 'IF marks >= 90 THEN',
    originalLine: 'IF marks >= 90',
    fixedLine: 'IF marks >= 90 THEN',
  };

  it('applies simple fix', () => {
    expect(applyFix('IF marks >= 90', baseIssue)).toBe('IF marks >= 90 THEN');
  });

  it('preserves line number prefix', () => {
    expect(applyFix('1. IF marks >= 90', baseIssue)).toBe('1. IF marks >= 90 THEN');
  });

  it('returns algorithm unchanged without a fixedLine', () => {
    const noFix = { ...baseIssue, fixedLine: undefined };
    expect(applyFix('IF marks >= 90', noFix)).toBe('IF marks >= 90');
  });
});
