import { describe, expect, it } from "vitest";

import {
  hasCorrection,
  normalizeCorrection,
  parseAIChatResponse,
} from "./aiChatResponse";

describe("parseAIChatResponse", () => {
  it("parses reply and correction from strict JSON", () => {
    const raw = JSON.stringify({
      reply: "To check even/odd, use the modulo (%) operator.",
      correction:
        "You chose a string. But even/odd needs an integer. Think of it this way: will the number divide by 2? So the input must be an integer.",
    });

    const result = parseAIChatResponse(raw);

    expect(result.reply).toBe("To check even/odd, use the modulo (%) operator.");
    expect(result.correction).toBe(
      "You chose a string. But even/odd needs an integer. Think of it this way: will the number divide by 2? So the input must be an integer."
    );
    expect(hasCorrection(result.correction)).toBe(true);
  });

  it("parses JSON wrapped in a markdown code fence", () => {
    const raw =
      '```json\n{"reply":"Repeat with a loop.","correction":"Use range(1, 5), not [0..4]."}\n```';

    const result = parseAIChatResponse(raw);

    expect(result.reply).toBe("Repeat with a loop.");
    expect(result.correction).toBe("Use range(1, 5), not [0..4].");
  });

  it("parses JSON embedded in extra model text", () => {
    const raw =
      'Here is the answer:\n{"reply":"Binary search runs on a sorted list.","correction":"First sort the list, then search."}\nThank you!';

    const result = parseAIChatResponse(raw);

    expect(result.reply).toBe("Binary search runs on a sorted list.");
    expect(result.correction).toBe("First sort the list, then search.");
  });

  it("returns an empty correction when the model reports no mistake", () => {
    const raw = JSON.stringify({
      reply: "Correct! The input must be an integer.",
      correction: "",
    });

    const result = parseAIChatResponse(raw);

    expect(result.reply).toBe("Correct! The input must be an integer.");
    expect(result.correction).toBe("");
    expect(hasCorrection(result.correction)).toBe(false);
  });

  it("treats placeholder corrections as no correction", () => {
    const raw = JSON.stringify({ reply: "Correct!", correction: "none" });

    const result = parseAIChatResponse(raw);

    expect(result.correction).toBe("");
  });

  it("falls back to the raw text as reply when the model returns plain text", () => {
    const raw = "Simple answer: convert the input to int().";

    const result = parseAIChatResponse(raw);

    expect(result.reply).toBe(raw);
    expect(result.correction).toBe("");
  });

  it("returns empty values for empty content", () => {
    expect(parseAIChatResponse("")).toEqual({ reply: "", correction: "" });
    expect(parseAIChatResponse(null)).toEqual({ reply: "", correction: "" });
    expect(parseAIChatResponse(undefined)).toEqual({ reply: "", correction: "" });
  });

  it("keeps plain text when JSON has no usable reply field", () => {
    const raw = '{"correction":"Define the variable."}';

    const result = parseAIChatResponse(raw);

    expect(result.reply).toBe(raw);
    expect(result.correction).toBe("");
  });
});

describe("normalizeCorrection", () => {
  it("trims a real correction", () => {
    expect(normalizeCorrection("  Use an integer.  ")).toBe("Use an integer.");
  });

  it("treats placeholders and non-strings as no correction", () => {
    expect(normalizeCorrection("N/A")).toBe("");
    expect(normalizeCorrection("None")).toBe("");
    expect(normalizeCorrection("-")).toBe("");
    expect(normalizeCorrection(null)).toBe("");
    expect(normalizeCorrection(42)).toBe("");
    expect(normalizeCorrection(undefined)).toBe("");
  });
});

describe("hasCorrection", () => {
  it("detects a usable correction string", () => {
    expect(hasCorrection("The input must be an integer.")).toBe(true);
  });

  it("rejects empty, whitespace and missing values", () => {
    expect(hasCorrection("")).toBe(false);
    expect(hasCorrection("   ")).toBe(false);
    expect(hasCorrection(undefined)).toBe(false);
    expect(hasCorrection(null)).toBe(false);
  });
});
