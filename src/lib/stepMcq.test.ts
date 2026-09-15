import { describe, expect, it } from "vitest";

import { buildStepMCQPrompt, parseStepMCQ } from "./stepMcq";

const VALID_MCQ = {
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

describe("parseStepMCQ", () => {
  it("parses a complete quiz from strict JSON", () => {
    expect(parseStepMCQ(JSON.stringify(VALID_MCQ))).toEqual(VALID_MCQ);
  });

  it("parses JSON wrapped in a markdown fence", () => {
    const raw = `Here is your quiz:\n\`\`\`json\n${JSON.stringify(VALID_MCQ)}\n\`\`\``;

    expect(parseStepMCQ(raw)).toEqual(VALID_MCQ);
  });

  it("accepts an already-parsed object (route response body)", () => {
    expect(parseStepMCQ(VALID_MCQ)).toEqual(VALID_MCQ);
  });

  it("accepts a numeric string for correctIndex", () => {
    const parsed = parseStepMCQ({ ...VALID_MCQ, correctIndex: "1" });

    expect(parsed?.correctIndex).toBe(1);
  });

  it("trims strings and drops empty options", () => {
    const parsed = parseStepMCQ({
      ...VALID_MCQ,
      question: "  Sawal?  ",
      options: ["  A option  ", "", "   ", "B option"],
      correctIndex: 1,
      concept: "  Loops  ",
    });

    expect(parsed?.question).toBe("Sawal?");
    expect(parsed?.options).toEqual(["A option", "B option"]);
    expect(parsed?.correctIndex).toBe(1);
    expect(parsed?.concept).toBe("Loops");
  });

  it("rejects the quiz when dropping empty options pushes the answer out of range", () => {
    const parsed = parseStepMCQ({
      ...VALID_MCQ,
      options: ["A option", "", "   ", "B option"],
      correctIndex: 3,
    });

    // Only two options survive, so index 3 no longer exists. Saying "the quiz
    // is broken" is better than pointing at the wrong answer.
    expect(parsed).toBeNull();
  });

  it("keeps the quiz when indexes still line up after trimming", () => {
    const parsed = parseStepMCQ({
      ...VALID_MCQ,
      options: ["  A option  ", "  B option  "],
      correctIndex: 1,
    });

    expect(parsed?.options).toEqual(["A option", "B option"]);
    expect(parsed?.correctIndex).toBe(1);
  });

  it("treats placeholder corrections as no correction", () => {
    expect(parseStepMCQ({ ...VALID_MCQ, correction: "none" })?.correction).toBe(
      ""
    );
  });

  it("fills missing explanations with empty strings", () => {
    const parsed = parseStepMCQ({
      question: "Loops mein kaunsa keyword use hota hai?",
      options: ["for", "def"],
      correctIndex: 0,
    });

    expect(parsed).toEqual({
      question: "Loops mein kaunsa keyword use hota hai?",
      options: ["for", "def"],
      correctIndex: 0,
      reasonCorrect: "",
      reasonWrong: "",
      correction: "",
      concept: "",
    });
  });

  it("rejects malformed payloads", () => {
    expect(parseStepMCQ("sorry, no JSON here")).toBeNull();
    expect(parseStepMCQ("")).toBeNull();
    expect(parseStepMCQ(null)).toBeNull();
    expect(parseStepMCQ(undefined)).toBeNull();
    expect(parseStepMCQ([VALID_MCQ])).toBeNull();
    expect(parseStepMCQ({})).toBeNull();
    // Question missing
    expect(parseStepMCQ({ ...VALID_MCQ, question: "   " })).toBeNull();
    // Fewer than two usable options
    expect(parseStepMCQ({ ...VALID_MCQ, options: ["only one"] })).toBeNull();
    expect(parseStepMCQ({ ...VALID_MCQ, options: "not an array" })).toBeNull();
    // correctIndex missing / out of range / not an integer
    expect(parseStepMCQ({ ...VALID_MCQ, correctIndex: undefined })).toBeNull();
    expect(parseStepMCQ({ ...VALID_MCQ, correctIndex: 9 })).toBeNull();
    expect(parseStepMCQ({ ...VALID_MCQ, correctIndex: -1 })).toBeNull();
    expect(parseStepMCQ({ ...VALID_MCQ, correctIndex: 1.5 })).toBeNull();
  });
});

describe("buildStepMCQPrompt", () => {
  it("includes the learner's step context", () => {
    const prompt = buildStepMCQPrompt({
      step: 2,
      problemStatement: "Check if a number is even or odd",
      inputs: ["number (integer)"],
      outputs: ["result"],
      rules: ["Input 0 se bada hona chahiye"],
    });

    expect(prompt).toContain("Current Step: 2/6");
    expect(prompt).toContain("Check if a number is even or odd");
    expect(prompt).toContain(
      "Inputs (Step 1 data - context only): number (integer)"
    );
    expect(prompt).toContain("Outputs (Step 1 data - context only): result");
    expect(prompt).toContain(
      "Rules (Step 1 data - context only): Input 0 se bada hona chahiye"
    );
    expect(prompt).toContain("Return ONLY valid JSON");
    expect(prompt).toContain('"correctIndex"');
    expect(prompt).toContain('"correction"');
  });

  it("asks about the fields of the current step (1-6)", () => {
    const fieldsByStep: Array<[number, string]> = [
      [1, "STEP 1 FIELDS:"],
      [2, "STEP 2 FIELDS:"],
      [3, "STEP 3 FIELDS:"],
      [4, "STEP 4 FIELDS:"],
      [5, "STEP 5 FIELDS:"],
      [6, "STEP 6 FIELDS:"],
    ];

    for (const [step, marker] of fieldsByStep) {
      const prompt = buildStepMCQPrompt({
        step,
        problemStatement: "Do numbers ka sum nikalo",
        inputs: ["number1 (integer)", "number2 (integer)"],
        outputs: ["sum"],
        rules: ["Dono numbers positive hone chahiye"],
      });

      expect(prompt).toContain(`Current Step: ${step}/6`);
      expect(prompt).toContain(marker);
      expect(prompt).toContain(`Question MUST be about Step ${step}'s fields`);
      // The problem itself must still be part of what the question is about.
      expect(prompt).toContain("Problem Statement: Do numbers ka sum nikalo");
      expect(prompt).toContain("number1 (integer)");
      expect(prompt).toContain("Outputs (Step 1 data - context only): sum");
      expect(prompt).toContain("Dono numbers positive hone chahiye");
    }
  });

  it("keeps Step 2 on Required Data / Tools / Concepts instead of Step 1 inputs", () => {
    const prompt = buildStepMCQPrompt({
      step: 2,
      problemStatement: "Check if a number is even or odd",
    });

    expect(prompt).toContain("Required Data:");
    expect(prompt).toContain("Tools & Functions:");
    expect(prompt).toContain("Logical Concepts:");
    expect(prompt).toContain("CRITICAL: Do NOT ask about problem inputs here");
    expect(prompt).toContain(
      "For Step 2: ask about data types, operators, concepts - NOT problem inputs"
    );
    // Step 1 data stays available as context only, never as the question itself.
    expect(prompt).toContain("Step 1 data - context only");
  });

  it("aims the quiz at the focused field when the UI sends one", () => {
    const prompt = buildStepMCQPrompt({
      step: 2,
      currentField: "  Required Data  ",
    });

    expect(prompt).toContain('User is currently working on: "Required Data"');
    expect(prompt).toContain("Ask about THIS specific field.");

    const withoutField = buildStepMCQPrompt({ step: 2, currentField: "   " });

    expect(withoutField).not.toContain("currently working on");
  });

  it("falls back to empty-context labels", () => {
    const prompt = buildStepMCQPrompt({ step: 1 });

    expect(prompt).toContain("Not defined yet");
    expect(prompt).toContain(
      "Inputs (Step 1 data - context only): None defined"
    );
    expect(prompt).toContain(
      "Outputs (Step 1 data - context only): None defined"
    );
    expect(prompt).toContain(
      "Rules (Step 1 data - context only): None defined"
    );
  });

  it("falls back to a generic guide for an unknown step", () => {
    const prompt = buildStepMCQPrompt({ step: 9 });

    expect(prompt).toContain("Current Step: 9/6");
    expect(prompt).toContain("General programming question");
    expect(prompt).toContain(
      "Inputs (Step 1 data - context only): None defined"
    );
    expect(prompt).toContain("Problem Statement: Not defined yet");
  });

  it("keeps the answer out of the option text and the JSON shape stable", () => {
    const prompt = buildStepMCQPrompt({
      step: 3,
      problemStatement: "Even/odd check karo",
    });

    // Options must not be self-labelled as correct/wrong.
    expect(prompt).toContain('no "(correct)" or "(wrong)" hints');
    // Only the JSON block may contain the answer index.
    expect(prompt).toContain('"correctIndex": 0');
    // The style example must not be copied onto a different problem.
    expect(prompt).toContain("Do NOT reuse the even/odd content");
    expect(prompt).toContain("Options: 4");
  });
});
