import { NextRequest, NextResponse } from "next/server";

import { parseAIChatResponse } from "@/lib/aiChatResponse";
import { callGroqWithFallback } from "@/lib/groqModels";

export const runtime = "nodejs";
export const maxDuration = 30;

interface ChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { message, currentStep, problemStatement, inputs, outputs, rules, chatHistory } = await req.json();

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error("[AI-CHAT] GROQ_API_KEY not configured");
      return NextResponse.json(
        { error: "AI not configured. Please add GROQ_API_KEY." },
        { status: 503 }
      );
    }

        const systemPrompt = `You are a friendly programming tutor for beginners.
Respond in simple, beginner-friendly English. Use short sentences. No Roman Urdu
or Hindi. Technical terms can stay English.
Context:
- Step: ${currentStep}/6
- Problem: ${problemStatement || "Not defined"}
- Inputs: ${inputs?.join(", ") || "None"}
- Outputs: ${outputs?.join(", ") || "None"}
- Rules: ${rules?.join(", ") || "None"}

Always answer with STRICT JSON only (no markdown, no text outside JSON):
{
  "reply": "2-4 sentence simple English answer, specific and with a small Python example",
  "correction": "What the learner did wrong + how to fix it + one short example of the correct approach"
}

Rules for "correction":
1. Say exactly what the learner got wrong (e.g. "You chose a string...").
2. Explain how to fix it in simple English, step by step.
3. Give one tiny example of the correct approach, always in Python.
4. If the learner has not made any mistake, use an empty string.`;

    // Groq's endpoint is OpenAI-compatible — alternating "user"/"assistant"
    // turns (plus a system prompt). Reuse the last 6 messages for context.
    const historyMessages = (chatHistory as ChatHistoryMessage[] | undefined || [])
      .slice(-6)
      .map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

    // Multi-model fallback: tries gpt-oss-120b, then llama-3.3-70b, then qwen3-32b.
    const { content: rawContent } = await callGroqWithFallback({
      messages: [
        { role: "system", content: systemPrompt },
        ...historyMessages,
        { role: "user", content: message },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });
    const { reply, correction } = parseAIChatResponse(rawContent);

    return NextResponse.json({
      reply: reply || "No response",
      correction,
    });
  } catch (error) {
    console.error("[AI-CHAT] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}
