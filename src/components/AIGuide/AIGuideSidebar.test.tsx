import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AIGuideSidebar } from "./AIGuideSidebar";

vi.mock("@/store/logicFlowStore", () => ({
  useLogicFlowStore: () => ({
    currentStep: 1,
    problemStatement: "Check if a number is even or odd",
    inputs: ["number (integer)"],
    outputs: ["result"],
    rules: [],
    setAIGuideEnabled: vi.fn(),
  }),
}));

describe("AIGuideSidebar", () => {
  it("shows the step tips by default", () => {
    render(<AIGuideSidebar />);

    expect(screen.getByText("Step 1: Problem Statement")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Quiz shuru karo" })
    ).not.toBeInTheDocument();
  });

  it("opens the AI quiz from the Quiz tab", () => {
    render(<AIGuideSidebar />);

    fireEvent.click(screen.getByRole("button", { name: "Quiz" }));

    expect(screen.getByText("Step 1: Quiz")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Quiz shuru karo" })
    ).toBeInTheDocument();
  });
});
