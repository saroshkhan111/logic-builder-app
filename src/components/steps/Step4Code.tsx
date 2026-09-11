"use client";

import { AlertCircle, Check, CheckCircle2, Edit2, FileCode, Play, Plus, Sparkles, Trash2, X } from "lucide-react";
import { useState, useMemo } from "react";

import { useLogicFlowStore } from "@/store/logicFlowStore";
import { suggestFileNames } from "@/lib/fileNameSuggester";
import { traceExecution, type DryRunResult } from "@/lib/dryRunVisualizer";

export const Step4Code = () => {
  const {
    setCurrentStep,
    fileName,
    setFileName,
    pythonCode,
    setPythonCode,
    codeNotes,
    addCodeNote,
    updateCodeNote,
    removeCodeNote,
    problemStatement,
    inputs,
    outputs,
  } = useLogicFlowStore();

  const [noteInput, setNoteInput] = useState("");
  const [editingNoteIdx, setEditingNoteIdx] = useState<number | null>(null);
  const [editNoteValue, setEditNoteValue] = useState("");
  const [dryRunResult, setDryRunResult] = useState<DryRunResult | null>(null);
  const [showDryRun, setShowDryRun] = useState(false);

  // PEP 8 Validation Check
  const isSnakeCase = /^[a-z0-9_]+\.py$/.test(fileName);

  // Smart file name suggestions
  const suggestedNames = useMemo(
    () => suggestFileNames(problemStatement, pythonCode, inputs, outputs),
    [problemStatement, pythonCode, inputs, outputs]
  );

  const handleSuggestionClick = (name: string) => {
    setFileName(name);
  };

  const handleDryRun = () => {
    const result = traceExecution(pythonCode);
    setDryRunResult(result);
    setShowDryRun(true);
  };

  const handleAddNote = () => {
    if (!noteInput.trim()) return;
    addCodeNote(noteInput.trim());
    setNoteInput("");
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 backdrop-blur space-y-6">
        <div>
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">
            STEP 4
          </span>
          <h2 className="text-xl font-bold text-white">Code Writing & PEP 8 Checker</h2>
          <p className="text-xs text-slate-400 mt-1">
            Convert your algorithm into readable Python code adhering to PEP 8 standards.
          </p>
        </div>

        {/* PEP 8 File Naming Checker */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <FileCode className="w-4 h-4 text-indigo-400" /> File Naming Checker (PEP 8 Compliant)
          </label>
          <div className="flex gap-3 items-center">
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="e.g. my_logic.py"
              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
            />
            {isSnakeCase ? (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5" /> Valid PEP 8
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-lg">
                <AlertCircle className="w-3.5 h-3.5" /> Use lowercase_snake_case.py
              </span>
            )}
          </div>

          {/* Smart File Name Suggestions */}
          {suggestedNames.length > 0 && (
            <div className="mt-2">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-indigo-300 mb-1.5">
                <Sparkles className="w-3 h-3" />
                <span>Suggested names (click to use):</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestedNames.map((name) => (
                  <button
                    key={name}
                    onClick={() => handleSuggestionClick(name)}
                    title="Click to use this name"
                    className={`px-3 py-1 rounded-full text-xs font-mono border transition-all cursor-pointer ${
                      fileName === name
                        ? "bg-indigo-600 border-indigo-500 text-white"
                        : "bg-indigo-950/50 border-indigo-700/50 text-indigo-300 hover:bg-indigo-900/60 hover:border-indigo-500 hover:text-white"
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Python Code Editor */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-300">Python Code Workspace</label>
            <button
              onClick={handleDryRun}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer"
            >
              <Play className="w-3 h-3" /> Dry Run
            </button>
          </div>
          <textarea
            value={pythonCode}
            onChange={(e) => setPythonCode(e.target.value)}
            placeholder="# Write Python code here..."
            className="w-full h-48 bg-slate-900 border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed resize-y"
          />
        </div>

        {/* Dry Run Visualizer Panel */}
        {showDryRun && dryRunResult && (
          <div className="bg-slate-950/60 p-4 rounded-xl border border-cyan-800/50 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
                <Play className="w-4 h-4 text-cyan-400" /> Dry Run Visualizer — Step-by-Step Execution
              </label>
              <button
                onClick={() => setShowDryRun(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {dryRunResult.steps.map((step, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg border text-xs ${
                    step.type === "comment"
                      ? "bg-slate-900/50 border-slate-800 text-slate-500"
                      : step.type === "function_def"
                      ? "bg-violet-950/30 border-violet-800/40"
                      : step.type === "return"
                      ? "bg-amber-950/30 border-amber-800/40"
                      : step.type === "print"
                      ? "bg-emerald-950/30 border-emerald-800/40"
                      : step.type === "control_flow"
                      ? "bg-blue-950/30 border-blue-800/40"
                      : step.type === "function_call"
                      ? "bg-pink-950/30 border-pink-800/40"
                      : "bg-slate-900/80 border-slate-700/50"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-mono text-slate-500 min-w-[20px] text-right pt-0.5">
                      {step.lineNumber}
                    </span>
                    <div className="flex-1 min-w-0">
                      <code className="text-slate-300 font-mono text-[11px] break-all">
                        {step.source.trim()}
                      </code>
                      {step.explanation && step.type !== "comment" && (
                        <p className="text-[10px] text-cyan-300/80 mt-0.5">
                          → {step.explanation}
                        </p>
                      )}
                      {Object.keys(step.variablesChanged).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {Object.entries(step.variablesChanged).map(([key, val]) => (
                            <span
                              key={key}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-800 rounded text-[10px] font-mono"
                            >
                              <span className="text-indigo-400">{key}</span>
                              <span className="text-slate-500">=</span>
                              <span className="text-emerald-400">{val}</span>
                            </span>
                          ))}
                        </div>
                      )}
                      {step.output && (
                        <p className="text-[10px] text-emerald-400 mt-0.5">
                          🖨️ Output: {step.output}
                        </p>
                      )}
                      {step.returnValue && (
                        <p className="text-[10px] text-amber-400 mt-0.5">
                          ↩️ Returns: {step.returnValue}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Final Scope Summary */}
            {Object.keys(dryRunResult.finalScope).length > 0 && (
              <div className="pt-2 border-t border-slate-800">
                <p className="text-[10px] font-semibold text-slate-400 mb-1.5">
                  Final Variables:
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(dryRunResult.finalScope).map(([key, val]) => (
                    <span
                      key={key}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-slate-800 rounded-lg text-[10px] font-mono border border-slate-700"
                    >
                      <span className="text-indigo-400">{key}</span>
                      <span className="text-slate-500">=</span>
                      <span className="text-emerald-400">{val}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Code Notes with CRUD */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
          <label className="block text-xs font-semibold text-slate-300">Code Notes & Annotations</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
              placeholder="e.g. This function checks for prime numbers"
              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleAddNote}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
          <div className="space-y-1.5 pt-1">
            {codeNotes.map((item, idx) =>
              editingNoteIdx === idx ? (
                <div
                  key={idx}
                  className="flex items-center gap-1 bg-slate-900 border border-violet-500 rounded-lg p-1 text-xs"
                >
                  <input
                    type="text"
                    value={editNoteValue}
                    onChange={(e) => setEditNoteValue(e.target.value)}
                    className="bg-transparent text-slate-100 text-xs focus:outline-none px-1 flex-1"
                  />
                  <button
                    onClick={() => {
                      if (editNoteValue.trim()) {
                        updateCodeNote(idx, editNoteValue.trim());
                      }
                      setEditingNoteIdx(null);
                    }}
                    className="text-emerald-400 hover:text-emerald-300 p-0.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setEditingNoteIdx(null)}
                    className="text-slate-400 hover:text-slate-300 p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs"
                >
                  <span className="text-violet-300 flex-1">{item}</span>
                  <button
                    onClick={() => {
                      setEditingNoteIdx(idx);
                      setEditNoteValue(item);
                    }}
                    className="text-violet-400 hover:text-white transition-colors cursor-pointer"
                    title="Edit Note"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => removeCodeNote(idx)}
                    className="text-violet-400 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Delete Note"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-2">
          <button
            onClick={() => setCurrentStep(3)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all cursor-pointer"
          >
            Back to Step 3
          </button>
          <button
            onClick={() => setCurrentStep(5)}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer"
          >
            Next: Testing
          </button>
        </div>
      </div>
    </div>
  );
};

export default Step4Code;
