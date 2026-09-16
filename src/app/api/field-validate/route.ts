import { NextRequest, NextResponse } from "next/server";

import {
  buildFieldValidationPrompt,
  parseFieldValidation,
} from "@/lib/fieldValidation";
import { callGroqWithFallback } from "@/lib/groqModels";

export const runtime = "nodejs";
export const maxDuration = 30;

// Same Groq setup as /api/step-mcq (key stays server-side),
// with multi-model fallback handled by callGroqWithFallback.

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

    // Multi-model fallback: tries gpt-oss-120b, then llama-3.3-70b, then qwen3-32b.
    const { content: rawContent } = await callGroqWithFallback({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      // Validation is a small verdict + reason, so a low effort / small budget
      // keeps the JSON from being cut off mid-string.
      reasoning_effort: "low",
      max_tokens: 500,
    });
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