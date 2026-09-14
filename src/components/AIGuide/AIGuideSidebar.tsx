"use client";

import { BookOpen, ChevronDown, ChevronUp, MessageSquare, X } from "lucide-react";
import { useState } from "react";

import { useLogicFlowStore } from "@/store/logicFlowStore";

import { AIChat } from "./AIChat";
import { StepTips } from "./StepTips";

type ActiveTab = "tips" | "chat";

export const AIGuideSidebar = () => {
  const { setAIGuideEnabled } = useLogicFlowStore();
  const [activeTab, setActiveTab] = useState<ActiveTab>("tips");
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <aside className="w-80 border-l border-slate-800 bg-slate-900/50 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-600 rounded-lg">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <h2 className="font-semibold text-white">AI Guide</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => setAIGuideEnabled(false)}
            className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
            title="Close AI Guide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      {isExpanded && (
        <>
          <div className="flex border-b border-slate-800">
            <button
              onClick={() => setActiveTab("tips")}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === "tips"
                  ? "text-indigo-400 border-b-2 border-indigo-400 bg-slate-900/50"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Tips
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === "chat"
                  ? "text-indigo-400 border-b-2 border-indigo-400 bg-slate-900/50"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Chat
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === "tips" && <StepTips />}
            {activeTab === "chat" && <AIChat />}
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
