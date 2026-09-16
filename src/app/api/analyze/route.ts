import { NextRequest, NextResponse } from 'next/server';

import { callGroqWithFallback } from '@/lib/groqModels';

export const runtime = 'nodejs';

interface AnalyzeRequest {
  algorithm: string;
}

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
    '2. Respond in simple, beginner-friendly English. Use short sentences. No Roman Urdu or Hindi. Technical terms can stay English',
    '3. Give line numbers (1-indexed)',
    '4. Be encouraging',
    '5. Always fill "correction": say what the learner did wrong, how to fix it,',
    '   and one short example of the correct approach. Use "" if nothing is wrong.',
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
    '      "message": "Short simple English explanation — what is wrong",',
    '      "suggestion": "1-line fix hint in simple English",',
    '      "fix": "Corrected line content or null",',
    '      "type": "keyword" | "structure" | "indentation" | "spelling" | "case" | "value" | "semantic"',
    '    }',
    '  ],',
    '  "overallFeedback": "One encouraging sentence in simple English",',
    '  "correction": "What the learner did wrong + how to fix it + one tiny example of the correct approach (simple English, 2-3 sentences). Empty string when there is no mistake.",',
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

    const { content: rawContent } = await callGroqWithFallback({
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
    });

    const data = JSON.parse(rawContent);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[ANALYZE] Error:', error);
    return NextResponse.json(
      { error: 'AI service unavailable' },
      { status: 503 }
    );
  }
}
