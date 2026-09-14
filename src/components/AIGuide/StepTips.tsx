"use client";

import { AlertCircle, BookOpen, Lightbulb } from "lucide-react";

import { useLogicFlowStore } from "@/store/logicFlowStore";

interface StepTip {
  title: string;
  tips: string[];
  commonMistakes?: string[];
}

const STEP_TIPS: Record<number, StepTip> = {
  1: {
    title: "Problem Statement",
    tips: [
      "Start by clearly defining what problem you're solving",
      "Identify all inputs - what data will you receive?",
      "Define expected outputs - what should your solution produce?",
      "List all rules and constraints that must be followed",
    ],
    commonMistakes: [
      "Being too vague about inputs and outputs",
      "Forgetting edge cases or constraints",
      "Not considering all possible input scenarios",
    ],
  },
  2: {
    title: "Requirements",
    tips: [
      "List all data structures you'll need to store information",
      "Identify tools, functions, or libraries that will help",
      "Think about logical concepts like loops, conditions, sorting",
      "Consider what pre-processing your data might need",
    ],
    commonMistakes: [
      "Choosing overly complex data structures",
      "Not thinking about efficiency from the start",
      "Overlooking built-in Python functions that could help",
    ],
  },
  3: {
    title: "Algorithm Design",
    tips: [
      "Break the problem into small, manageable steps",
      "Write pseudocode before jumping into real code",
      "Think about the order of operations carefully",
      "Consider using flowcharts to visualize logic flow",
    ],
    commonMistakes: [
      "Skipping the planning phase and coding directly",
      "Creating steps that are too large or complex",
      "Not thinking through all possible paths in your logic",
    ],
  },
  4: {
    title: "Code Writing",
    tips: [
      "Follow PEP 8 style guidelines for clean Python",
      "Use meaningful variable and function names",
      "Add comments to explain complex logic",
      "Keep functions small and focused on one task",
    ],
    commonMistakes: [
      "Writing long functions that do too many things",
      "Using unclear variable names like 'x', 'temp', 'data'",
      "Not handling potential errors or edge cases",
    ],
  },
  5: {
    title: "Testing",
    tips: [
      "Test with normal, expected inputs first",
      "Add edge cases: empty inputs, very large numbers, special characters",
      "Test boundary conditions (min/max values)",
      "Verify each test case manually before running",
    ],
    commonMistakes: [
      "Only testing the 'happy path' with perfect inputs",
      "Not testing edge cases or error conditions",
      "Assuming the first passing test means the code is correct",
    ],
  },
  6: {
    title: "Optimization",
    tips: [
      "Look for repeated code that can be simplified",
      "Consider time complexity - can you reduce loops?",
      "Check for unnecessary operations or redundant checks",
      "Improve code readability and maintainability",
    ],
    commonMistakes: [
      "Optimizing too early before verifying correctness",
      "Making code more complex in pursuit of minor gains",
      "Sacrificing readability for marginal performance improvements",
    ],
  },
};

export const StepTips = () => {
  const { currentStep } = useLogicFlowStore();
  const tipData = STEP_TIPS[currentStep] || STEP_TIPS[1];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-700">
        <BookOpen className="w-5 h-5 text-indigo-400" />
        <h3 className="font-semibold text-white">Step {currentStep}: {tipData.title}</h3>
      </div>

      {/* Tips Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-emerald-400">
          <Lightbulb className="w-4 h-4" />
          <span>Key Tips</span>
        </div>
        <ul className="space-y-2">
          {tipData.tips.map((tip, idx) => (
            <li key={idx} className="text-sm text-slate-300 pl-4 border-l-2 border-emerald-500/30">
              {tip}
            </li>
          ))}
        </ul>
      </div>

      {/* Common Mistakes Section */}
      {tipData.commonMistakes && tipData.commonMistakes.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-400">
            <AlertCircle className="w-4 h-4" />
            <span>Common Mistakes</span>
          </div>
          <ul className="space-y-2">
            {tipData.commonMistakes.map((mistake, idx) => (
              <li key={idx} className="text-sm text-slate-300 pl-4 border-l-2 border-amber-500/30">
                {mistake}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
