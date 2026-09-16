import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
  question: "Which operator checks even/odd?",
  options: ["+ (plus)", "% (modulo)", "* (multiply)", "/ (divide)"],
  correctIndex: 1,
  reasonCorrect:
    "Modulo (%) gives the remainder. If the remainder is 0, the number is even.",
  reasonWrong:
    "Plus only adds numbers. It does not give a remainder, so it cannot check even/odd.",
  correction:
    "Use number % 2 == 0. Example: if number % 2 == 0: print('Even').",
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
      fireEvent.click(screen.getByRole("button", { name: /start quiz/i }));
}

describe("MCQQuiz", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("shows the empty state first and generates on demand", () => {
    render(<MCQQuiz />);

    expect(screen.queryByText(MCQ_PAYLOAD.question)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /start quiz/i })
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

    await waitFor(() =>
      expect(screen.getByText("Modulo operator")).toBeInTheDocument()
    );
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
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Option B" })).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole("button", { name: "Option B" }));

        expect(await screen.findByText("Correct!")).toBeInTheDocument();
    expect(screen.getByText(MCQ_PAYLOAD.reasonCorrect)).toBeInTheDocument();
    expect(screen.queryByText(/correction/i)).not.toBeInTheDocument();
  });

  it("shows the wrong reason plus correction for a wrong pick", async () => {
    mockQuizResponse(MCQ_PAYLOAD);
    render(<MCQQuiz />);

    await startQuiz();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Option C" })).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole("button", { name: "Option C" }));

        expect(await screen.findByText("Incorrect - correct answer is B")).toBeInTheDocument();
    expect(screen.getByText(MCQ_PAYLOAD.reasonWrong)).toBeInTheDocument();
    expect(screen.getByText("Correction")).toBeInTheDocument();
    expect(screen.getByText(MCQ_PAYLOAD.correction)).toBeInTheDocument();
  });

  it("locks the options after the first pick", async () => {
    mockQuizResponse(MCQ_PAYLOAD);
    render(<MCQQuiz />);

    await startQuiz();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Option A" })).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole("button", { name: "Option A" }));

        expect(await screen.findByText(/incorrect/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Option B" })).toBeDisabled();
  });

  it("loads a new question from the feedback panel", async () => {
    mockQuizResponse(MCQ_PAYLOAD);
        mockQuizResponse({ ...MCQ_PAYLOAD, question: "New question?" });
    render(<MCQQuiz />);

    await startQuiz();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Option B" })).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole("button", { name: "Option B" }));
    fireEvent.click(await screen.findByRole("button", { name: "New question" }));

    expect(await screen.findByText("New question?")).toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("shows an error when the API fails", async () => {
    mockQuizResponse({ error: "AI not configured" }, false, 503);
    render(<MCQQuiz />);

    fireEvent.click(screen.getByRole("button", { name: /start quiz/i }));

    expect(
      await screen.findByText(/quiz could not be generated/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /try again/i })
    ).toBeInTheDocument();
  });

  it("shows an error when the payload is not a usable quiz", async () => {
    mockQuizResponse({ question: "", options: [] });
    render(<MCQQuiz />);

    fireEvent.click(screen.getByRole("button", { name: /start quiz/i }));

    expect(
      await screen.findByText(/quiz could not be generated/i)
    ).toBeInTheDocument();
  });
});
