import { describe, expect, it } from "vitest";

import {
  hasCorrection,
  normalizeCorrection,
  parseAIChatResponse,
} from "./aiChatResponse";

describe("parseAIChatResponse", () => {
  it("parses reply and correction from strict JSON", () => {
    const raw = JSON.stringify({
      reply: "Even/odd check karne ke liye modulo (%) use karo.",
      correction:
        "Tumne string choose kiya. Par even/odd check karne ke liye integer chahiye. Aise socho: number 2 se divide hoga ya nahi. Isliye input integer hona chahiye.",
    });

    const result = parseAIChatResponse(raw);

    expect(result.reply).toBe("Even/odd check karne ke liye modulo (%) use karo.");
    expect(result.correction).toBe(
      "Tumne string choose kiya. Par even/odd check karne ke liye integer chahiye. Aise socho: number 2 se divide hoga ya nahi. Isliye input integer hona chahiye."
    );
    expect(hasCorrection(result.correction)).toBe(true);
  });

  it("parses JSON wrapped in a markdown code fence", () => {
    const raw =
      '```json\n{"reply":"Loops se repeat karo.","correction":"range(1, 5) use karo, [0..4] nahi."}\n```';

    const result = parseAIChatResponse(raw);

    expect(result.reply).toBe("Loops se repeat karo.");
    expect(result.correction).toBe("range(1, 5) use karo, [0..4] nahi.");
  });

  it("parses JSON embedded in extra model text", () => {
    const raw =
      'Ye raha jawab:\n{"reply":"Sorted list par binary search chalti hai.","correction":"Pehle sort karo, phir search."}\nShukriya!';

    const result = parseAIChatResponse(raw);

    expect(result.reply).toBe("Sorted list par binary search chalti hai.");
    expect(result.correction).toBe("Pehle sort karo, phir search.");
  });

  it("returns an empty correction when the model reports no mistake", () => {
    const raw = JSON.stringify({
      reply: "Bilkul sahi! Input integer hi lena chahiye.",
      correction: "",
    });

    const result = parseAIChatResponse(raw);

    expect(result.reply).toBe("Bilkul sahi! Input integer hi lena chahiye.");
    expect(result.correction).toBe("");
    expect(hasCorrection(result.correction)).toBe(false);
  });

  it("treats placeholder corrections as no correction", () => {
    const raw = JSON.stringify({ reply: "Sahi hai!", correction: "none" });

    const result = parseAIChatResponse(raw);

    expect(result.correction).toBe("");
  });

  it("falls back to the raw text as reply when the model returns plain text", () => {
    const raw = "Simple answer: input ko int() mein convert karo.";

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
    const raw = '{"correction":"Variable define karo."}';

    const result = parseAIChatResponse(raw);

    expect(result.reply).toBe(raw);
    expect(result.correction).toBe("");
  });
});

describe("normalizeCorrection", () => {
  it("trims a real correction", () => {
    expect(normalizeCorrection("  Integer use karo.  ")).toBe("Integer use karo.");
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
    expect(hasCorrection("Input integer hona chahiye.")).toBe(true);
  });

  it("rejects empty, whitespace and missing values", () => {
    expect(hasCorrection("")).toBe(false);
    expect(hasCorrection("   ")).toBe(false);
    expect(hasCorrection(undefined)).toBe(false);
    expect(hasCorrection(null)).toBe(false);
  });
});