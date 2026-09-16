export const GROQ_MODELS = [
  "openai/gpt-oss-120b",
  "llama-3.3-70b-versatile",
  "qwen/qwen3-32b",
] as const;

export const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function callGroqWithFallback(params: {
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: string };
  reasoning_effort?: "low" | "medium" | "high";
}): Promise<{ content: string; model: string }> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY not configured");
  }

  const errors: string[] = [];

  for (const model of GROQ_MODELS) {
    try {
      const body: Record<string, unknown> = {
        model,
        messages: params.messages,
        temperature: params.temperature ?? 0.5,
        max_tokens: params.max_tokens ?? 1200,
      };

      if (params.response_format) body.response_format = params.response_format;
      if (params.reasoning_effort && model.includes("gpt-oss")) {
        body.reasoning_effort = params.reasoning_effort;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000);

      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.status === 429) {
        errors.push(`${model}: rate limited`);
        continue;
      }
      if (!response.ok) {
        errors.push(`${model}: ${response.status}`);
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        errors.push(`${model}: empty response`);
        continue;
      }

      console.log(`[GROQ] Success with model: ${model}`);
      return { content, model };
    } catch (err) {
      errors.push(`${model}: ${err instanceof Error ? err.message : "Unknown"}`);
      continue;
    }
  }

  throw new Error(`All Groq models failed:\n${errors.join("\n")}`);
}
