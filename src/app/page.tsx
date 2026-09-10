"use client";

import { BrainCircuit, CheckCircle2, Sparkles } from "lucide-react";

import { Step1Problem } from "@/components/steps/Step1Problem";
import { Step2Requirements } from "@/components/steps/Step2Requirements";
import { Step3Algorithm } from "@/components/steps/Step3Algorithm";
import { Step4Code } from "@/components/steps/Step4Code";
import { Step5Testing } from "@/components/steps/Step5Testing";
import { Step6Optimization } from "@/components/steps/Step6Optimization";
import { useLogicFlowStore } from "@/store/logicFlowStore";

const STEPS = [
  { id: 1, name: "1. Problem Statement", desc: "Understand inputs, outputs & rules" },
  { id: 2, name: "2. Requirements", desc: "Tools, data & needed skills" },
  { id: 3, name: "3. Algorithm Design", desc: "Pseudocode & flowcharts" },
  { id: 4, name: "4. Code Writing", desc: "Write PEP 8 clean Python code" },
  { id: 5, name: "5. Testing", desc: "In-browser code execution & test cases" },
  { id: 6, name: "6. Optimization", desc: "Refactor for efficiency & readability" },
];

export default function HomePage() {
  const { currentStep, setCurrentStep } = useLogicFlowStore();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg text-white">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white">Logic Builder</h1>
            <p className="text-xs text-slate-400">Step-by-Step Problem Solving for Beginners</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-full">
          <Sparkles className="w-3.5 h-3.5" /> Beginner Guided Mode
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar - 6 Steps Visual Stepper */}
        <aside className="w-full md:w-80 border-r border-slate-800 bg-slate-900/30 p-6">
          <h2 className="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-4">6 Logic Steps</h2>
          <nav className="space-y-3">
            {STEPS.map((s) => {
              const isActive = currentStep === s.id;
              const isCompleted = currentStep > s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setCurrentStep(s.id)}
                  className={`w-full text-left p-3 rounded-xl transition border cursor-pointer ${
                    isActive
                      ? "bg-indigo-600/10 border-indigo-500/50 text-white"
                      : isCompleted
                      ? "bg-slate-900/80 border-slate-800 text-slate-300"
                      : "bg-slate-900/20 border-transparent text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{s.name}</span>
                    {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <p className="text-xs text-slate-400">{s.desc}</p>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content Workspace */}
        <main className="flex-1 p-6 md:p-10 max-w-4xl">
          {currentStep === 1 && <Step1Problem />}
          {currentStep === 2 && <Step2Requirements />}
          {currentStep === 3 && <Step3Algorithm />}
          {currentStep === 4 && <Step4Code />}
          {currentStep === 5 && <Step5Testing />}
          {currentStep === 6 && <Step6Optimization />}
        </main>
      </div>
    </div>
  );
}