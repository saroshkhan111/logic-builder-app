import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

const mockFetch = vi.fn();
global.fetch = mockFetch;

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost/api/ai-chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const REQUEST_BODY = {
    message: "My even/odd program is not running.",
  currentStep: 1,
  problemStatement: "Check if a number is even or odd",
  inputs: ["number (string)"],
  outputs: ["result"],
  rules: [],
  chatHistory: [],
};

describe("POST /api/ai-chat", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    process.env.GROQ_API_KEY = "test-key";
  });

  afterEach(() => {
    delete process.env.GROQ_API_KEY;
  });

  it("returns reply and correction from the model JSON", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                                reply: "Use the modulo (%) operator: number % 2 == 0.",
                correction:
                  "You chose a string. But even/odd needs an integer. The input must be an integer.",
              }),
            },
          },
        ],
      }),
    });

    const response = await POST(makeRequest(REQUEST_BODY));
    const data = await response.json();

    expect(response.status).toBe(200);
        expect(data.reply).toBe("Use the modulo (%) operator: number % 2 == 0.");
    expect(data.correction).toBe(
      "You chose a string. But even/odd needs an integer. The input must be an integer."
    );
  });

  it("returns an empty correction when the model reports no mistake", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
                        content: JSON.stringify({ reply: "All correct!", correction: "" }),
            },
          },
        ],
      }),
    });

    const response = await POST(makeRequest(REQUEST_BODY));
    const data = await response.json();

        expect(data.reply).toBe("All correct!");
    expect(data.correction).toBe("");
  });

  it("falls back to plain text with an empty correction", async () => {
        const plainReply = "Convert the input to int().";
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: plainReply } }],
      }),
    });

    const response = await POST(makeRequest(REQUEST_BODY));
    const data = await response.json();

    expect(data.reply).toBe(plainReply);
    expect(data.correction).toBe("");
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