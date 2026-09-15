import { NextRequest, NextResponse } from "next/server";

import {
  buildFieldValidationPrompt,
  parseFieldValidation,
} from "@/lib/fieldValidation";

export const runtime = "nodejs";
export const maxDuration = 30;

// Same Groq setup as /api/step-mcq (key stays server-side).
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "openai/gpt-oss-120b";

interface FieldValidateRequest {
  step?: number;
  fieldName?: string;
  fieldValue?: string;
  problemStatement?: string;
  existingData?: string;
}

export async function POST(req: NextRequest) {
  try {
    const {
      step,
      fieldName,
      fieldValue,
      problemStatement,
      existingData,
    }: FieldValidateRequest = await req.json();

    // Nothing to validate without a field and the value the learner typed.
    if (!fieldName?.trim() || !fieldValue?.trim()) {
      return NextResponse.json(
        { error: "fieldName and fieldValue are required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error("[FIELD-VALIDATE] GROQ_API_KEY not configured");
      return NextResponse.json(
        { error: "AI not configured. Please add GROQ_API_KEY." },
        { status: 503 }
      );
    }

    const prompt = buildFieldValidationPrompt({
      step: Number(step) || 1,
      fieldName,
      fieldValue,
      problemStatement,
      existingData,
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
        temperature: 0.3,
        // Validation is a small verdict + reason, so a low effort / small budget
        // keeps the JSON from being cut off mid-string.
        reasoning_effort: "low",
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[FIELD-VALIDATE] Groq error:", errorText);
      return NextResponse.json(
        { error: `Groq API error: ${response.status}` },
        { status: 500 }
      );
    }

    const data = await response.json();
    const rawContent: string = data.choices?.[0]?.message?.content || "";
    const validation = parseFieldValidation(rawContent);

    if (!validation) {
      console.error(
        "[FIELD-VALIDATE] Model returned an unusable validation:",
        rawContent.slice(0, 300)
      );
      return NextResponse.json(
        { error: "AI returned an unusable validation" },
        { status: 500 }
      );
    }

    return NextResponse.json(validation);
  } catch (error) {
    console.error("[FIELD-VALIDATE] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}