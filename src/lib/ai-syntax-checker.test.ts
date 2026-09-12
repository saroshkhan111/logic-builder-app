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
              complexity: 'medium',
            }),
          },
        }],
      }),
    });

    const result = await analyzeWithAI('IF marks >= 90');
    expect(result.aiAnalyzed).toBe(true);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].message).toBe('Missing THEN');
    expect(result.complexity).toBe('medium');
    expect(result.overallFeedback).toBe('Good!');
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
    expect(result.issues[0].message).toBe('Valid issue');
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
