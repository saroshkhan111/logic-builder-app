import { describe, it, expect, vi, beforeEach } from 'vitest';

import { analyzeWithAI, clearAICache } from './ai-syntax-checker';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('analyzeWithAI', () => {
  beforeEach(() => {
    clearAICache();
    mockFetch.mockReset();
  });

  it('returns empty for empty algorithm', async () => {
    const result = await analyzeWithAI('');
    expect(result.issues).toEqual([]);
    expect(result.aiAnalyzed).toBe(false);
    expect(result.overallFeedback).toBe('Start writing your algorithm to see feedback.');
  });

  it('returns empty for whitespace-only algorithm', async () => {
    const result = await analyzeWithAI('   \n\t\n   ');
    expect(result.issues).toEqual([]);
    expect(result.aiAnalyzed).toBe(false);
  });

  it('falls back when API route returns 503 (key missing)', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 503,
      ok: false,
    });
    const result = await analyzeWithAI('IF marks >= 90');
    expect(result.aiAnalyzed).toBe(false);
    // Static checker should find missing THEN
    expect(result.issues.length).toBeGreaterThan(0);
    // No AI → no learner-specific correction
    expect(result.correction).toBe('');
  });

  it('returns empty correction when the AI reports no mistake', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              issues: [],
              overallFeedback: 'Perfect!',
              correction: '',
              complexity: 'simple',
            }),
          },
        }],
      }),
    });

    const result = await analyzeWithAI('START\nDISPLAY "Hello"\nEND');
    expect(result.aiAnalyzed).toBe(true);
    expect(result.correction).toBe('');
  });

  it('treats placeholder corrections as no correction', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              issues: [],
              overallFeedback: 'Nice work!',
              correction: 'none',
              complexity: 'simple',
            }),
          },
        }],
      }),
    });

    const result = await analyzeWithAI('START\nDISPLAY "Hello"\nEND');
    expect(result.correction).toBe('');
  });

  it('uses cache on repeated calls with same algorithm', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 503,
      ok: false,
    });
    const algo = 'START\nDISPLAY "Hello"\nEND';
    const result1 = await analyzeWithAI(algo);
    const result2 = await analyzeWithAI(algo);
    expect(result2.cached).toBe(true);
    expect(result1.issues).toEqual(result2.issues);
  });

  it('parses valid response from /api/analyze', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              issues: [{
                lineNumber: 1,
                severity: 'error',
                message: 'Missing THEN',
                suggestion: 'Add THEN',
                fix: 'IF marks >= 90 THEN',
                type: 'structure',
              }],
              overallFeedback: 'Good!',
              correction: 'You chose a string. Even/odd needs an integer.',
              complexity: 'medium',
            }),
          },
        }],
      }),
    });

    const result = await analyzeWithAI('IF marks >= 90');
    expect(result.aiAnalyzed).toBe(true);
    expect(result.issues).toHaveLength(1);

    const issue = result.issues[0];
    expect(issue.line).toBe(1);
    expect(issue.type).toBe('structure');
    // The AI's message lands in the beginner-friendly explanation slot.
    expect(issue.explanation).toBe('Missing THEN');
    // The title comes from the per-type map (simple English), not from the model.
    expect(issue.title).toBe('Block is not complete');
    // The AI's fix doubles as the example + one-click fixed line.
    expect(issue.example).toBe('IF marks >= 90 THEN');
    expect(issue.fixedLine).toBe('IF marks >= 90 THEN');
    // The learner's own line at that position is attached for context.
    expect(issue.originalLine).toBe('IF marks >= 90');

    expect(result.complexity).toBe('medium');
    expect(result.overallFeedback).toBe('Good!');
    expect(result.correction).toBe(
      'You chose a string. Even/odd needs an integer.'
    );
  });

  it('falls back when API returns non-ok status', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 429,
      ok: false,
    });

    const result = await analyzeWithAI('IF marks >= 90');
    expect(result.aiAnalyzed).toBe(false);
    // Should fall back to static checker
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it('falls back when fetch throws (network error)', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await analyzeWithAI('IF marks >= 90');
    expect(result.aiAnalyzed).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it('falls back when response has no content', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({
        choices: [],
      }),
    });

    const result = await analyzeWithAI('IF marks >= 90');
    expect(result.aiAnalyzed).toBe(false);
  });

  it('falls back when response has invalid JSON', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: 'not valid json {{{',
          },
        }],
      }),
    });

    const result = await analyzeWithAI('IF marks >= 90');
    expect(result.aiAnalyzed).toBe(false);
  });

  it('handles markdown-wrapped JSON response', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: '```json\n{"issues":[],"overallFeedback":"Perfect!","complexity":"simple"}\n```',
          },
        }],
      }),
    });

    const result = await analyzeWithAI('START\nDISPLAY "Hello"\nEND');
    expect(result.aiAnalyzed).toBe(true);
    expect(result.issues).toHaveLength(0);
    expect(result.overallFeedback).toBe('Perfect!');
  });

  it('handles raw newlines inside JSON string values', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            // Literal newlines inside the "message" and "overallFeedback"
            // strings — the exact case that makes JSON.parse throw
            // "Bad control character in string literal in JSON".
            content: '{"issues":[{"lineNumber":2,"severity":"error","message":"First line\nSecond line","suggestion":"Fix it","type":"structure"}],"overallFeedback":"Almost\ngreat!","complexity":"medium"}',
          },
        }],
      }),
    });

    const result = await analyzeWithAI('START\nDISPLAY\nEND');
    expect(result.aiAnalyzed).toBe(true);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].explanation).toBe('First line\nSecond line');
    expect(result.issues[0].originalLine).toBe('DISPLAY');
    expect(result.overallFeedback).toBe('Almost\ngreat!');
  });

  it('filters out invalid issues from response', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              issues: [
                { lineNumber: 1, severity: 'error', message: 'Valid issue', suggestion: 'Fix it', type: 'structure' },
                { lineNumber: 'bad', severity: 'error', message: 'Invalid', suggestion: 'Bad line' },
                { severity: 'error', message: 'No line number', suggestion: 'Skip' },
              ],
              overallFeedback: 'Mixed',
              complexity: 'simple',
            }),
          },
        }],
      }),
    });

    const result = await analyzeWithAI('DISPLAY "test"');
    expect(result.aiAnalyzed).toBe(true);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].explanation).toBe('Valid issue');
    expect(result.issues[0].originalLine).toBe('DISPLAY "test"');
    expect(result.issues[0].title).toBe('Block is not complete');
  });
});

describe('clearAICache', () => {
  it('clears the cache', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 503,
      ok: false,
    });
    const algo = 'START\nDISPLAY "Hello"\nEND';
    await analyzeWithAI(algo); // populates cache
    clearAICache();
    mockFetch.mockResolvedValueOnce({
      status: 503,
      ok: false,
    });
    const result = await analyzeWithAI(algo);
    expect(result.cached).toBeUndefined();
  });
});
