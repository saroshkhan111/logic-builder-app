import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MCQQuiz } from "./MCQQuiz";

const mockFetch = vi.fn();
global.fetch = mockFetch;

vi.mock("@/store/logicFlowStore", () => ({
  useLogicFlowStore: () => ({
    currentStep: 1,
    problemStatement: "Check if a number is even or odd",
    inputs: ["number (integer)"],
    outputs: ["result"],
    rules: [],
  }),
}));

const MCQ_PAYLOAD = {
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

function mockQuizResponse(payload: unknown, ok = true, status = 200) {
  mockFetch.mockResolvedValueOnce({
    ok,
    status,
    json: async () => payload,
  });
}

async function startQuiz() {
  fireEvent.click(screen.getByRole("button", { name: /quiz shuru karo/i }));
  await screen.findByText(MCQ_PAYLOAD.question);
}

describe("MCQQuiz", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("shows the empty state first and generates on demand", () => {
    render(<MCQQuiz />);

    expect(screen.queryByText(MCQ_PAYLOAD.question)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /quiz shuru karo/i })
    ).toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("sends the learner's step context to /api/step-mcq", async () => {
    mockQuizResponse(MCQ_PAYLOAD);
    render(<MCQQuiz />);

    await startQuiz();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("/api/step-mcq");
    expect(JSON.parse(init.body as string)).toEqual({
      step: 1,
      problemStatement: "Check if a number is even or odd",
      inputs: ["number (integer)"],
      outputs: ["result"],
      rules: [],
    });
  });

  it("renders the options and the concept", async () => {
    mockQuizResponse(MCQ_PAYLOAD);
    render(<MCQQuiz />);

    await startQuiz();

    expect(screen.getByText("Modulo operator")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Option A" })).toHaveTextContent(
      "+ (plus)"
    );
    expect(screen.getByRole("button", { name: "Option D" })).toHaveTextContent(
      "/ (divide)"
    );
  });

  it("celebrates the correct answer with the correct reason", async () => {
    mockQuizResponse(MCQ_PAYLOAD);
    render(<MCQQuiz />);

    await startQuiz();
    fireEvent.click(screen.getByRole("button", { name: "Option B" }));

    expect(await screen.findByText("Sahi jawab!")).toBeInTheDocument();
    expect(screen.getByText(MCQ_PAYLOAD.reasonCorrect)).toBeInTheDocument();
    expect(screen.queryByText(/correction/i)).not.toBeInTheDocument();
  });

  it("shows the wrong reason plus correction for a wrong pick", async () => {
    mockQuizResponse(MCQ_PAYLOAD);
    render(<MCQQuiz />);

    await startQuiz();
    fireEvent.click(screen.getByRole("button", { name: "Option C" }));

    expect(await screen.findByText("Galat - sahi jawab B")).toBeInTheDocument();
    expect(screen.getByText(MCQ_PAYLOAD.reasonWrong)).toBeInTheDocument();
    expect(screen.getByText("Correction")).toBeInTheDocument();
    expect(screen.getByText(MCQ_PAYLOAD.correction)).toBeInTheDocument();
  });

  it("locks the options after the first pick", async () => {
    mockQuizResponse(MCQ_PAYLOAD);
    render(<MCQQuiz />);

    await startQuiz();
    fireEvent.click(screen.getByRole("button", { name: "Option A" }));

    expect(await screen.findByText(/galat/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Option B" })).toBeDisabled();
  });

  it("loads a new question from the feedback panel", async () => {
    mockQuizResponse(MCQ_PAYLOAD);
    mockQuizResponse({ ...MCQ_PAYLOAD, question: "Naya sawal?" });
    render(<MCQQuiz />);

    await startQuiz();
    fireEvent.click(screen.getByRole("button", { name: "Option B" }));
    fireEvent.click(await screen.findByRole("button", { name: "Naya sawal" }));

    expect(await screen.findByText("Naya sawal?")).toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("shows an error when the API fails", async () => {
    mockQuizResponse({ error: "AI not configured" }, false, 503);
    render(<MCQQuiz />);

    fireEvent.click(screen.getByRole("button", { name: /quiz shuru karo/i }));

    expect(
      await screen.findByText(/quiz generate nahi ho paya/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /dobara try karo/i })
    ).toBeInTheDocument();
  });

  it("shows an error when the payload is not a usable quiz", async () => {
    mockQuizResponse({ question: "", options: [] });
    render(<MCQQuiz />);

    fireEvent.click(screen.getByRole("button", { name: /quiz shuru karo/i }));

    expect(
      await screen.findByText(/quiz generate nahi ho paya/i)
    ).toBeInTheDocument();
  });
});
