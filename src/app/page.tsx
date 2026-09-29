"use client";

import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  MessageSquare,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { AIGuideSidebar } from "@/components/AIGuide";
import { Step1Problem } from "@/components/steps/Step1Problem";
import { Step2Requirements } from "@/components/steps/Step2Requirements";
import { Step3Algorithm } from "@/components/steps/Step3Algorithm";
import { Step4Code } from "@/components/steps/Step4Code";
import { Step5Testing } from "@/components/steps/Step5Testing";
import { Step6Optimization } from "@/components/steps/Step6Optimization";
import { useLogicFlowStore } from "@/store/logicFlowStore";

const STEPS = [
  { id: 1, name: "Problem Statement", desc: "Understand inputs, outputs & rules" },
  { id: 2, name: "Requirements", desc: "Tools, data & needed skills" },
  { id: 3, name: "Algorithm Design", desc: "Algorithm & flowcharts" },
  { id: 4, name: "Code Writing", desc: "Write PEP 8 clean Python code" },
  { id: 5, name: "Testing", desc: "In-browser code execution & test cases" },
  { id: 6, name: "Optimization", desc: "Refactor for efficiency & readability" },
];

export default function HomePage() {
  const {
    currentStep,
    setCurrentStep,
    aiGuideEnabled,
    setAIGuideEnabled,
    reset,
  } = useLogicFlowStore();
  const [showNewProblemModal, setShowNewProblemModal] = useState(false);

  const handleStartNewProblem = () => {
    reset();
    setCurrentStep(1);
    setShowNewProblemModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500/30">
      {/* Top Navbar - Polished IDE Style */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/30 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-lg shadow-indigo-500/20">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="font-bold text-sm tracking-tight text-white uppercase">Logic Builder <span className="text-indigo-400">IDE</span></h1>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Professional Logic Engineering</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setAIGuideEnabled(!aiGuideEnabled)}
            className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-md transition-all cursor-pointer font-medium ${
              aiGuideEnabled
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-slate-200"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            AI Intelligence
          </button>
          <button
            onClick={() => setShowNewProblemModal(true)}
            className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-md transition-all cursor-pointer bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            New Session
          </button>
          <div className="hidden md:flex items-center gap-2 text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-1 rounded-md font-bold uppercase tracking-tighter">
            <Sparkles className="w-3 h-3" /> Guided Mode Active
          </div>
        </div>
      </header>

      {/* Start a New Problem confirmation modal */}
      <AnimatePresence>
        {showNewProblemModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setShowNewProblemModal(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
            >
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                <AlertTriangle className="w-4 h-4" /> Reset Session?
              </div>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                This will clear your current logic flow. All progress in the 6 steps will be lost, but your saved projects remain safe.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowNewProblemModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartNewProblem}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-all cursor-pointer"
                >
                  Confirm Reset
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main IDE Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Rail - Condensed Timeline Style */}
        <aside className="w-64 shrink-0 border-r border-slate-800 bg-slate-950 flex flex-col">
          <div className="p-6">
            <h2 className="text-[10px] uppercase font-bold text-slate-500 tracking-[0.2em] mb-6">Logic Pipeline</h2>
            <nav className="relative space-y-1">
              {/* The Vertical Timeline Line */}
              <div className="absolute left-4 top-2 bottom-2 w-px bg-slate-800 z-0" />

              {STEPS.map((s) => {
                const isActive = currentStep === s.id;
                const isCompleted = currentStep > s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setCurrentStep(s.id)}
                    className={`group relative w-full text-left p-3 rounded-r-xl transition-all duration-200 cursor-pointer z-10 flex items-start gap-4 ${
                      isActive
                        ? "bg-indigo-600/10 text-white"
                        : isCompleted
                        ? "text-slate-400 hover:text-slate-200"
                        : "text-slate-600 hover:text-slate-400"
                    }`}
                  >
                    {/* Step Indicator Dot */}
                    <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 transition-all duration-300 ${
                      isActive
                        ? "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)] scale-125"
                        : isCompleted
                        ? "bg-emerald-500"
                        : "bg-slate-700 group-hover:bg-slate-500"
                    }`} />

                    <div className="flex flex-col overflow-hidden">
                      <span className={`font-semibold text-xs transition-colors ${isActive ? "text-indigo-300" : ""}`}>
                        {s.name}
                      </span>
                      <p className="text-[10px] text-slate-500 line-clamp-1 group-hover:text-slate-400 transition-colors">
                        {s.desc}
                      </p>
                    </div>
                    {isCompleted && (
                      <CheckCircle2 className="w-3 h-3 text-emerald-500 absolute right-3 top-3" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto p-6 border-t border-slate-800 bg-slate-900/20">
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              System Ready
            </div>
          </div>
        </aside>

        {/* Main Canvas Workspace */}
        <main className="flex-1 overflow-y-auto bg-slate-950 relative">
          <div className="max-w-4xl mx-auto p-8 md:p-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                {currentStep === 1 && <Step1Problem />}
                {currentStep === 2 && <Step2Requirements />}
                {currentStep === 3 && <Step3Algorithm />}
                {currentStep === 4 && <Step4Code />}
                {currentStep === 5 && <Step5Testing />}
                {currentStep === 6 && <Step6Optimization />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* AI Intelligence Panel - Integrated Sidebar */}
        {aiGuideEnabled && (
          <aside className="w-80 shrink-0 border-l border-slate-800 bg-slate-900/20 backdrop-blur-sm overflow-hidden flex flex-col">
            <AIGuideSidebar />
          </aside>
        )}
      </div>
    </div>
  );
}
