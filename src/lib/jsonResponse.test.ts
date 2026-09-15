import { describe, expect, it } from "vitest";

import {
  extractJsonObject,
  parseJsonObject,
  stripCodeFence,
} from "./jsonResponse";

describe("stripCodeFence", () => {
  it("removes a json fence", () => {
    expect(stripCodeFence('```json\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it("removes a plain fence", () => {
    expect(stripCodeFence('```\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it("leaves plain JSON untouched", () => {
    expect(stripCodeFence('{"a":1}')).toBe('{"a":1}');
  });
});

describe("extractJsonObject", () => {
  it("returns the first object block", () => {
    expect(extractJsonObject('text {"a":1} trailing')).toBe('{"a":1}');
  });

  it("returns an empty string when there is no object", () => {
    expect(extractJsonObject("no json")).toBe("");
    expect(extractJsonObject("}{")).toBe("");
  });
});

describe("parseJsonObject", () => {
  it("parses raw JSON", () => {
    expect(parseJsonObject('{"reply":"ok"}')).toEqual({ reply: "ok" });
  });

  it("parses fenced and embedded JSON", () => {
    expect(parseJsonObject('```json\n{"reply":"ok"}\n```')).toEqual({
      reply: "ok",
    });
    expect(parseJsonObject('Ye raha: {"reply":"ok"} shukriya')).toEqual({
      reply: "ok",
    });
  });

  it("rejects non-object values", () => {
    expect(parseJsonObject("[1,2]")).toBeNull();
    expect(parseJsonObject("42")).toBeNull();
    expect(parseJsonObject("plain text")).toBeNull();
    expect(parseJsonObject("")).toBeNull();
    expect(parseJsonObject(null)).toBeNull();
    expect(parseJsonObject(undefined)).toBeNull();
  });
});
