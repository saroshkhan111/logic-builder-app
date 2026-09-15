import { NextRequest, NextResponse } from "next/server";

import { parseAIChatResponse } from "@/lib/aiChatResponse";

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

    const systemPrompt = `You are a friendly programming tutor for beginners (Hinglish).
Context:
- Step: ${currentStep}/6
- Problem: ${problemStatement || "Not defined"}
- Inputs: ${inputs?.join(", ") || "None"}
- Outputs: ${outputs?.join(", ") || "None"}
- Rules: ${rules?.join(", ") || "None"}

Always answer with STRICT JSON only (no markdown, no text outside JSON):
{
  "reply": "2-4 sentence Hinglish answer, specific and with a small Python example",
  "correction": "What the learner did wrong + how to fix it + one short example of the correct approach"
}

Rules for "correction":
1. Say exactly what the learner got wrong (e.g. "Tumne string choose kiya...").
2. Explain how to fix it in simple Hinglish, step by step.
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

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [
            { role: "system", content: systemPrompt },
            ...historyMessages,
            { role: "user", content: message },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[AI-CHAT] Groq error:", errorText);
      return NextResponse.json(
        { error: `Groq API error: ${response.status}` },
        { status: 500 }
      );
    }

    const data = await response.json();
    const rawContent: string = data.choices?.[0]?.message?.content || "";
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
