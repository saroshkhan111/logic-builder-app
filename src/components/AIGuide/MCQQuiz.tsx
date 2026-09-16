"use client";

import {
  CheckCircle2,
  Lightbulb,
  ListChecks,
  Loader2,
  RefreshCw,
  Sparkles,
  Trophy,
  XCircle,
} from "lucide-react";
import { useState } from "react";

import { hasCorrection } from "@/lib/aiChatResponse";
import type { StepMCQ } from "@/lib/stepMcq";
import { parseStepMCQ } from "@/lib/stepMcq";
import { useLogicFlowStore } from "@/store/logicFlowStore";

const OPTION_LABELS = ["A", "B", "C", "D"];

function optionLabel(index: number): string {
  return OPTION_LABELS[index] ?? String(index + 1);
}

export const MCQQuiz = () => {
  const { currentStep, problemStatement, inputs, outputs, rules } =
    useLogicFlowStore();
  const [loadedMcq, setLoadedMcq] = useState<StepMCQ | null>(null);
  const [quizStep, setQuizStep] = useState<number | null>(null);
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [failure, setFailure] = useState<{
    step: number;
    message: string;
  } | null>(null);

  // Derived view state: the quiz is only shown for the step it was generated
  // for, so switching steps hides the old question (no reset-effect needed).
  const mcq = quizStep === currentStep ? loadedMcq : null;
  const selectedIndex = quizStep === currentStep ? pickedIndex : null;
  const error = failure && failure.step === currentStep ? failure.message : "";

  const generateQuiz = async () => {
    if (isLoading) return;

    const stepAtRequest = currentStep;
    setIsLoading(true);
    setFailure(null);
    setPickedIndex(null);

    try {
      const response = await fetch("/api/step-mcq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: stepAtRequest,
          problemStatement,
          inputs,
          outputs,
          rules,
        }),
      });

      if (!response.ok) {
        throw new Error("AI service failed");
      }

      const data = await response.json();
      const parsed = parseStepMCQ(data);

      if (!parsed) {
        throw new Error("AI returned an unusable quiz");
      }

      setLoadedMcq(parsed);
      setQuizStep(stepAtRequest);
    } catch (err) {
      console.error("MCQ Quiz error:", err);
      setLoadedMcq(null);
      setQuizStep(stepAtRequest);
      setFailure({
        step: stepAtRequest,
        message: "Sorry, the quiz could not be generated. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (index: number) => {
    if (selectedIndex !== null) return;
    setPickedIndex(index);
  };

  const isAnswered = selectedIndex !== null;
  const isCorrect =
    isAnswered && mcq ? selectedIndex === mcq.correctIndex : false;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-700 pb-2">
        <div className="flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-indigo-400" />
          <h3 className="font-semibold text-white">Step {currentStep}: Quiz</h3>
        </div>
        <button
          onClick={generateQuiz}
          disabled={isLoading}
          aria-label="Load a new question"
          title="Load a new question"
          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
          Generating question...
        </div>
      )}

      {/* Error */}
      {!isLoading && error && (
        <div className="space-y-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3">
          <p className="text-xs text-rose-100">{error}</p>
          <button
            onClick={generateQuiz}
            className="flex items-center gap-2 text-xs font-medium text-rose-300 transition-colors hover:text-rose-200"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && !mcq && (
        <div className="space-y-3">
          <p className="text-sm text-slate-300">
            Check how much you understood from this step. I will create one
            multiple-choice question.
          </p>
          <button
            onClick={generateQuiz}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
          >
            <Sparkles className="h-4 w-4" />
            Start quiz
          </button>
        </div>
      )}

      {/* Question + options */}
      {!isLoading && mcq && (
        <div className="space-y-3">
          {mcq.concept && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-2.5 py-1 text-[11px] font-medium text-indigo-300">
              <Lightbulb className="h-3 w-3" />
              {mcq.concept}
            </span>
          )}

          <p className="text-sm font-medium text-slate-100">{mcq.question}</p>

          <div className="space-y-2">
            {mcq.options.map((option, index) => {
              const isSelected = selectedIndex === index;
              const isRightAnswer = isAnswered && index === mcq.correctIndex;
              const isWrongSelection =
                isAnswered && isSelected && index !== mcq.correctIndex;

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelect(index)}
                  disabled={isAnswered}
                  aria-label={`Option ${optionLabel(index)}`}
                  className={`flex w-full items-start gap-2 rounded-lg border p-2.5 text-left text-sm transition-colors ${
                    isRightAnswer
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
                      : isWrongSelection
                        ? "border-rose-500/40 bg-rose-500/10 text-rose-100"
                        : "border-slate-700 bg-slate-800 text-slate-200"
                  } ${
                    isAnswered
                      ? "cursor-default"
                      : "hover:border-indigo-500/50 hover:bg-slate-700/60"
                  }`}
                >
                  <span className="shrink-0 font-mono text-xs text-slate-400">
                    {optionLabel(index)}
                  </span>
                  <span className="flex-1">{option}</span>
                  {isRightAnswer && (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  )}
                  {isWrongSelection && (
                    <XCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Feedback */}
          {isAnswered && (
            <div
              className={`space-y-2 rounded-lg border p-3 ${
                isCorrect
                  ? "border-emerald-500/30 bg-emerald-500/10"
                  : "border-rose-500/30 bg-rose-500/10"
              }`}
            >
              <div className="flex items-center gap-2">
                {isCorrect ? (
                  <Trophy className="h-4 w-4 text-emerald-400" />
                ) : (
                  <XCircle className="h-4 w-4 text-rose-400" />
                )}
                <span
                  className={`text-xs font-bold ${
                    isCorrect ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {isCorrect
                    ? "Correct!"
                    : `Incorrect - correct answer is ${optionLabel(mcq.correctIndex)}`}
                </span>
              </div>

              {(isCorrect ? mcq.reasonCorrect : mcq.reasonWrong) && (
                <p className="text-xs whitespace-pre-wrap text-slate-200">
                  {isCorrect ? mcq.reasonCorrect : mcq.reasonWrong}
                </p>
              )}

              {/* Correction: what went wrong + how to fix it */}
              {!isCorrect && hasCorrection(mcq.correction) && (
                <div className="space-y-1 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2">
                  <span className="block text-xs font-bold text-amber-400">
                    Correction
                  </span>
                  <p className="text-xs whitespace-pre-wrap text-amber-100">
                    {mcq.correction}
                  </p>
                </div>
              )}

              <button
                onClick={generateQuiz}
                className="flex items-center gap-2 text-xs font-medium text-indigo-300 transition-colors hover:text-indigo-200"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                New question
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
