import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface AnalyzeRequest {
  algorithm: string;
}

const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';
const MISTRAL_MODEL = 'mistral-small-latest';
const REQUEST_TIMEOUT_MS = 15000;

function buildPrompt(algorithm: string): string {
  const bt = String.fromCharCode(96);
  const tripleBt = bt + bt + bt;
  return [
    'You are an expert pseudocode syntax checker for a beginner-friendly app.',
    '',
    'Analyze this pseudocode:',
    tripleBt,
    algorithm,
    tripleBt,
    '',
    'RULES:',
    '1. Universal: Support ANY pseudocode style (IF/FI, IF/ENDIF, SWITCH/CASE, WHILE/ENDWHILE, FOR/ENDFOR)',
    '2. Beginner-friendly explanations',
    '3. Give line numbers (1-indexed)',
    '4. Be encouraging',
    '',
    'CHECK FOR:',
    '- Missing keywords (THEN, ENDIF, END, FI)',
    '- Typos in keywords',
    '- Case inconsistency (if vs IF)',
    '- Structural issues (unclosed blocks)',
    '- Indentation problems',
    '- Missing arguments (INPUT without variable)',
    '- Semantic issues (undefined variables)',
    '',
    'RETURN STRICT JSON ONLY (no markdown, no explanation outside JSON):',
    '{',
    '  "issues": [',
    '    {',
    '      "lineNumber": 3,',
    '      "severity": "error" | "warning" | "info",',
    '      "message": "Short description in simple English",',
    '      "suggestion": "How to fix (1 line)",',
    '      "fix": "Corrected line content or null",',
    '      "type": "keyword" | "structure" | "indentation" | "spelling" | "case" | "value" | "semantic"',
    '    }',
    '  ],',
    '  "overallFeedback": "One encouraging sentence",',
    '  "complexity": "simple" | "medium" | "complex"',
    '}',
  ].join('\n');
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();
    const { algorithm } = body;

    if (!algorithm || typeof algorithm !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid algorithm field' },
        { status: 400 }
      );
    }

    if (algorithm.length > 10000) {
      return NextResponse.json(
        { error: 'Algorithm too long (max 10000 chars)' },
        { status: 400 }
      );
    }

    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      console.warn('MISTRAL_API_KEY not configured — returning 503');
      return NextResponse.json(
        { error: 'API key not configured', fallback: true },
        { status: 503 }
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(MISTRAL_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: MISTRAL_MODEL,
          messages: [
            {
              role: 'system',
              content: 'You are a pseudocode syntax checker. Return valid JSON only.',
            },
            {
              role: 'user',
              content: buildPrompt(algorithm),
            },
          ],
          temperature: 0.1,
          max_tokens: 1500,
          response_format: { type: 'json_object' },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`Mistral API error (${response.status}):`, errorText);
        return NextResponse.json(
          { error: `Mistral API error: ${response.status}`, fallback: true },
          { status: response.status }
        );
      }

      const data = await response.json();
      return NextResponse.json(data);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Mistral API timeout', fallback: true },
          { status: 504 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Analyze route error:', error);
    return NextResponse.json(
      { error: 'Internal server error', fallback: true },
      { status: 500 }
    );
  }
}
