import { NextRequest, NextResponse } from "next/server";

import { buildStepMCQPrompt, parseStepMCQ } from "@/lib/stepMcq";

export const runtime = "nodejs";
export const maxDuration = 30;

// Same Groq setup as /api/ai-chat (key stays server-side).
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "openai/gpt-oss-120b";

interface StepMCQRequest {
  step?: number;
  problemStatement?: string;
  inputs?: string[];
  outputs?: string[];
  rules?: string[];
  /** Optional field of the current step the learner is focused on. */
  currentField?: string;
}

export async function POST(req: NextRequest) {
  try {
    const {
      step,
      problemStatement,
      inputs,
      outputs,
      rules,
      currentField,
    }: StepMCQRequest = await req.json();

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error("[STEP-MCQ] GROQ_API_KEY not configured");
      return NextResponse.json(
        { error: "AI not configured. Please add GROQ_API_KEY." },
        { status: 503 }
      );
    }

    const prompt = buildStepMCQPrompt({
      step: Number(step) || 1,
      problemStatement,
      inputs,
      outputs,
      rules,
      currentField,
    });

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
        // The quiz JSON is long and gpt-oss also spends hidden reasoning
        // tokens, so "low" effort + 1200 tokens keep the JSON from being cut
        // off mid-string (which would make the whole quiz unusable).
        reasoning_effort: "low",
        max_tokens: 1200,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[STEP-MCQ] Groq error:", errorText);
      return NextResponse.json(
        { error: `Groq API error: ${response.status}` },
        { status: 500 }
      );
    }

    const data = await response.json();
    const rawContent: string = data.choices?.[0]?.message?.content || "";
    const mcq = parseStepMCQ(rawContent);

    if (!mcq) {
      console.error(
        "[STEP-MCQ] Model returned an unusable quiz:",
        rawContent.slice(0, 300)
      );
      return NextResponse.json(
        { error: "AI returned an unusable quiz" },
        { status: 500 }
      );
    }

    return NextResponse.json(mcq);
  } catch (error) {
    console.error("[STEP-MCQ] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}
