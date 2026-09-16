"use client";

import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  ListChecks,
  MessageSquare,
  X,
} from "lucide-react";
import { useState } from "react";

import { useLogicFlowStore } from "@/store/logicFlowStore";

import { AIChat } from "./AIChat";
import { MCQQuiz } from "./MCQQuiz";
import { StepTips } from "./StepTips";

type ActiveTab = "tips" | "chat" | "quiz";

export const AIGuideSidebar = () => {
  const { setAIGuideEnabled } = useLogicFlowStore();
  const [activeTab, setActiveTab] = useState<ActiveTab>("tips");
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <aside className="flex h-full w-full shrink-0 flex-col border-l border-slate-800 bg-slate-900/50 md:w-80">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 p-4">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-indigo-600 p-1.5">
            <MessageSquare className="h-4 w-4 text-white" />
          </div>
          <h2 className="font-semibold text-white">AI Guide</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={() => setAIGuideEnabled(false)}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            title="Close AI Guide"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      {isExpanded && (
        <>
          <div className="flex border-b border-slate-800">
            <button
              onClick={() => setActiveTab("tips")}
              className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "tips"
                  ? "border-b-2 border-indigo-400 bg-slate-900/50 text-indigo-400"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              <BookOpen className="h-4 w-4" />
              Tips
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "chat"
                  ? "border-b-2 border-indigo-400 bg-slate-900/50 text-indigo-400"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              Chat
            </button>
            <button
              onClick={() => setActiveTab("quiz")}
              className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "quiz"
                  ? "border-b-2 border-indigo-400 bg-slate-900/50 text-indigo-400"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              <ListChecks className="h-4 w-4" />
              Quiz
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === "tips" && <StepTips />}
            {activeTab === "chat" && <AIChat />}
            {activeTab === "quiz" && <MCQQuiz />}
          </div>
        </>
      )}

      {/* Collapsed State */}
      {!isExpanded && (
        <div className="p-4 text-center text-sm text-slate-400">
          Click to expand AI Guide
        </div>
      )}
    </aside>
  );
};
