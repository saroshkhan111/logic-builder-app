import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

const mockFetch = vi.fn();
global.fetch = mockFetch;

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost/api/step-mcq", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const REQUEST_BODY = {
  step: 2,
  problemStatement: "Check if a number is even or odd",
  inputs: ["number (integer)"],
  outputs: ["result"],
  rules: ["Input 0 se bada hona chahiye"],
};

const MODEL_PAYLOAD = {
  question: "Even/odd check karne ke liye kaunsa operator use karte hain?",
  options: ["+ (plus)", "% (modulo)", "* (multiply)", "/ (divide)"],
  correctIndex: 1,
  reasonCorrect:
    "Modulo (%) remainder deta hai. Agar remainder 0 ho to number even hai.",
  reasonWrong:
    "Plus sirf jodta hai, remainder nahi deta. Isliye even/odd check nahi ho payega.",
  correction:
    "number % 2 == 0 use karo. Example: if number % 2 == 0: print('Even').",
  concept: "Modulo operator",
};

function mockModelResponse(content: string) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ choices: [{ message: { content } }] }),
  });
}

describe("POST /api/step-mcq", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    process.env.GROQ_API_KEY = "test-key";
  });

  afterEach(() => {
    delete process.env.GROQ_API_KEY;
  });

  it("returns the parsed MCQ for the current step", async () => {
    mockModelResponse(JSON.stringify(MODEL_PAYLOAD));

    const response = await POST(makeRequest(REQUEST_BODY));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(MODEL_PAYLOAD);
  });

  it("parses a quiz wrapped in a markdown fence", async () => {
    mockModelResponse(`\`\`\`json\n${JSON.stringify(MODEL_PAYLOAD)}\n\`\`\``);

    const response = await POST(makeRequest(REQUEST_BODY));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.question).toBe(MODEL_PAYLOAD.question);
    expect(data.correctIndex).toBe(1);
  });

  it("sends the learner's step context to Groq", async () => {
    mockModelResponse(JSON.stringify(MODEL_PAYLOAD));

    await POST(makeRequest(REQUEST_BODY));

    const [url, init] = mockFetch.mock.calls[0];
    const sentBody = JSON.parse(init.body as string);

    expect(url).toBe("https://api.groq.com/openai/v1/chat/completions");
    expect(sentBody.model).toBe("openai/gpt-oss-120b");
    // "low" effort keeps gpt-oss reasoning tokens from eating the quiz JSON
    // budget, which used to truncate the JSON and break parsing.
    expect(sentBody.reasoning_effort).toBe("low");
    expect(sentBody.max_tokens).toBeGreaterThanOrEqual(1000);
    expect(sentBody.messages[0].content).toContain("Current Step: 2/6");
    expect(sentBody.messages[0].content).toContain(
      "Check if a number is even or odd"
    );
    expect(sentBody.messages[0].content).toContain("number (integer)");
    expect(sentBody.messages[0].content).toContain(
      "Input 0 se bada hona chahiye"
    );
    // The quiz must target Step 2's own fields, not Step 1's inputs.
    expect(sentBody.messages[0].content).toContain("STEP 2 FIELDS:");
    expect(sentBody.messages[0].content).toContain("Required Data:");
    expect(sentBody.messages[0].content).toContain("Tools & Functions:");
    expect(sentBody.messages[0].content).toContain("Logical Concepts:");
  });

  it("forwards the focused field to the prompt", async () => {
    mockModelResponse(JSON.stringify(MODEL_PAYLOAD));

    await POST(
      makeRequest({ ...REQUEST_BODY, currentField: "Tools & Functions" })
    );

    const [, init] = mockFetch.mock.calls[0];
    const content = JSON.parse(init.body as string).messages[0].content;

    expect(content).toContain(
      'User is currently working on: "Tools & Functions"'
    );

    mockModelResponse(JSON.stringify(MODEL_PAYLOAD));
    await POST(makeRequest(REQUEST_BODY));

    const [, secondInit] = mockFetch.mock.calls[1];
    const secondContent = JSON.parse(secondInit.body as string).messages[0]
      .content;

    expect(secondContent).not.toContain("currently working on");
  });

  it("defaults to step 1 when the step is missing", async () => {
    mockModelResponse(JSON.stringify(MODEL_PAYLOAD));

    await POST(makeRequest({ problemStatement: "Sum two numbers" }));

    const [, init] = mockFetch.mock.calls[0];
    const sentBody = JSON.parse(init.body as string);

    expect(sentBody.messages[0].content).toContain("Current Step: 1/6");
  });

  it("returns 500 when the model answer is not a usable quiz", async () => {
    mockModelResponse("Sorry, main abhi quiz nahi bana sakta.");

    const response = await POST(makeRequest(REQUEST_BODY));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain("unusable quiz");
  });

  it("returns 500 when Groq fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: async () => "rate limited",
    });

    const response = await POST(makeRequest(REQUEST_BODY));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain("429");
  });

  it("returns 503 when GROQ_API_KEY is missing", async () => {
    delete process.env.GROQ_API_KEY;

    const response = await POST(makeRequest(REQUEST_BODY));
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.error).toContain("GROQ_API_KEY");
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
