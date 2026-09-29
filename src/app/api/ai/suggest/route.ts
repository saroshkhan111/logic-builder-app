import { NextRequest, NextResponse } from "next/server";
import { callGroqWithFallback } from "@/lib/groqModels";
import { LogicFlowState } from "@/types/flow";

export async function POST(req: NextRequest) {
  try {
    const { step, currentText, context } = await req.json();

    const prompts: Record<number, string> = {
      1: "The user is defining a problem statement. If it's too short or missing constraints (inputs, outputs, rules), suggest a professional way to complete it or a critical question they missed. Keep the suggestion brief and as a continuation of their text.",
      2: "The user is listing requirements. Suggest a missing tool, a common Python library (like math, itertools, collections), or a technical constraint they might have overlooked.",
      3: "The user is writing an algorithm/pseudocode. Suggest the next logical step in the sequence (e.g., 'Now check if the list is empty' or 'Loop through the array').",
      4: "The user is writing Python code. Suggest the next line of code, a PEP 8 improvement, or a more efficient Pythonic way to write the current logic.",
      5: "The user is creating test cases. Suggest a critical edge case (e.g., empty input, very large number, negative value) based on the problem statement in the context.",
      6: "The user is optimizing code. Suggest a specific refactoring technique (e.g., 'Use a dictionary for O(1) lookup') to improve time or space complexity.",
    };

    const systemPrompt = `
      You are a world-class competitive programming coach.
      Your goal is to guide a beginner through the 6-step logic building process.

      CRITICAL RULES:
      1. Your output MUST be ONLY the suggested text to append to the user's current input.
      2. Do NOT say "I suggest..." or "You should add...".
      3. Just provide the text that would naturally follow the user's current input.
      4. If the user's input is already perfect, return an empty string.
      5. Keep suggestions short (max 10-15 words).
      6. Be encouraging but technically precise.
    `;

    const userPrompt = `
      Step: ${step}
      Context: ${JSON.stringify(context)}
      Current Text: "${currentText}"
      Guidance: ${prompts[step]}

      Provide the ghost suggestion text to follow the current text:
    `;

    const response = await callGroqWithFallback({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
    });

    const suggestion = response.content || "";

    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error("AI Suggestion Error:", error);
    return NextResponse.json({ error: "Failed to fetch suggestion" }, { status: 500 });
  }
}
