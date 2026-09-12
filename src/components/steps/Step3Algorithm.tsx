"use client";

import { GitBranch, Terminal } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { SyntaxChecker } from "@/components/algorithm/SyntaxChecker";
import FlowChart from "@/components/flow/FlowChart";
import { analyzeWithAI, type AIAnalysisResult } from "@/lib/ai-syntax-checker";
import { parseAlgorithm } from "@/lib/algorithmParser";
import { applyFix } from "@/lib/algorithmSyntaxChecker";
import type { SyntaxIssue } from "@/lib/algorithmSyntaxChecker";
import { useDebounce } from "@/lib/useDebounce";
import { useLogicFlowStore } from "@/store/logicFlowStore";

export const Step3Algorithm = () => {
  const {
    setCurrentStep,
    algorithm,
    setAlgorithm,
    pseudocodeSteps,
    setPseudocodeSteps,
  } = useLogicFlowStore();

  // Auto-resize textarea ref + effect
  const algorithmTextareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = algorithmTextareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [algorithm]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setAlgorithm(text);
    const steps = text.split("\n").filter((line) => line.trim() !== "");
    setPseudocodeSteps(steps);
  };

  // AI-powered syntax analysis with debounce
  const debouncedAlgorithm = useDebounce(algorithm, 500);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult>({
    issues: [],
    overallFeedback: 'Start writing your algorithm to see feedback.',
    complexity: 'simple',
    aiAnalyzed: false,
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function analyze() {
      if (!debouncedAlgorithm.trim()) {
        setAnalysisResult({
          issues: [],
          overallFeedback: 'Start writing your algorithm to see feedback.',
          complexity: 'simple',
          aiAnalyzed: false,
        });
        return;
      }

      setIsAnalyzing(true);
      try {
        const result = await analyzeWithAI(debouncedAlgorithm);
        if (!cancelled) setAnalysisResult(result);
      } catch (error) {
        console.warn('Analysis failed:', error);
      } finally {
        if (!cancelled) setIsAnalyzing(false);
      }
    }

    analyze();
    return () => { cancelled = true; };
  }, [debouncedAlgorithm]);

  const syntaxIssues = analysisResult.issues;

  const handleFixIssue = (issue: SyntaxIssue) => {
    const fixed = applyFix(algorithm, issue);
    setAlgorithm(fixed);
    const steps = fixed.split("\n").filter((line) => line.trim() !== "");
    setPseudocodeSteps(steps);
  };

  const decisionCount = pseudocodeSteps.filter((s) =>
    /^(if|else if|while|for)\b/i.test(s.trim())
  ).length;

  const complexityLabel =
    decisionCount <= 2
      ? "Simple"
      : decisionCount <= 4
      ? "Medium"
      : "Complex";

  const complexityColor =
    decisionCount <= 2
      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
      : decisionCount <= 4
      ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
      : "text-rose-400 bg-rose-500/10 border-rose-500/20";

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 backdrop-blur space-y-6">
        <div>
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">
            STEP 3
          </span>
          <h2 className="text-xl font-bold text-white">
            Algorithm Design & Flowchart
          </h2>
          <p className="text-sm text-slate-400 mt-1 leading-relaxed">
            Write your algorithm one line at a time. A flowchart will be generated automatically.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Column 1 - Algorithm Writer (60%) */}
          <div className="lg:col-span-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
              <Terminal className="w-4 h-4" /> Algorithm Writer
              {syntaxIssues.length > 0 && (
                <span className="text-[10px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded">
                  {syntaxIssues.length}
                </span>
              )}
            </div>
            <textarea
              ref={algorithmTextareaRef}
              value={algorithm}
              onChange={handleTextareaChange}
              placeholder={"START\n1. Create two variables.\n2. Assign values...\n3. Calculate result.\n4. Display output.\nEND"}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-4 text-sm font-mono text-emerald-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 leading-relaxed resize-y min-h-[200px]"
            />
            <details className="mt-3 bg-slate-950/60 rounded-lg border border-slate-800 group">
              <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-sky-400 hover:text-sky-300 select-none flex items-center gap-2">
                <span className="group-open:rotate-90 transition-transform">▶</span>
                <span>Detected Steps: {pseudocodeSteps.length} {pseudocodeSteps.length > 0 ? "✓" : ""}</span>
              </summary>
              <div className="px-3 pb-3 space-y-1 max-h-40 overflow-y-auto">
                {pseudocodeSteps.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">
                    Start writing your algorithm to see steps here
                  </p>
                ) : (
                  pseudocodeSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-900/60 text-xs"
                    >
                      <span className="text-sky-400 font-mono font-bold min-w-[20px]">
                        {idx + 1}.
                      </span>
                      <span className="text-sky-300 font-mono">{step}</span>
                    </div>
                  ))
                )}
              </div>
            </details>
          </div>

          {/* Column 2 - Live Flowchart (40%) */}
          <div className="lg:col-span-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                <GitBranch className="w-4 h-4" /> Live Flowchart
              </div>
              <div className="flex gap-2 text-[10px] text-slate-500">
                <span>Start/End</span>
                <span>Input/Output</span>
                <span>Decision</span>
              </div>
            </div>
            <FlowChart nodes={parseAlgorithm(pseudocodeSteps.join("\n"))} />
            <div className={`mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${complexityColor}`}>
              <span>Complexity: {complexityLabel}</span>
            </div>
            <SyntaxChecker
              issues={syntaxIssues}
              onFix={handleFixIssue}
              isLoading={isAnalyzing}
              overallFeedback={analysisResult.overallFeedback}
              aiAnalyzed={analysisResult.aiAnalyzed}
              complexity={analysisResult.complexity}
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-2">
          <button
            onClick={() => setCurrentStep(2)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl flex items-center gap-2 transition-all cursor-pointer"
          >
            Back to Step 2
          </button>
          <button
            onClick={() => setCurrentStep(4)}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer"
          >
            Next: Code Writing
          </button>
        </div>
      </div>
    </div>
  );
};

export default Step3Algorithm;
