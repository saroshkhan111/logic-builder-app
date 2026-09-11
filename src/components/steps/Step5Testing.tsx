"use client";

import { Check, CheckCircle2, Clock, Edit2, Play, Plus, RefreshCw, Trash2, TriangleAlert, Wand2, X, XCircle } from "lucide-react";
import { useState } from "react";

import { TestSourceBadge } from "@/components/testing/TestSourceBadge";
import { runSmartPythonCode } from "@/lib/pyodide/runner";
import { generateTestCases } from "@/lib/smartTestGenerator";
import { useLogicFlowStore, type TestCase } from "@/store/logicFlowStore";


export const Step5Testing = () => {
  const {
    setCurrentStep,
    inputs,
    outputs,
    rules,
    problemStatement,
    testCases,
    addTestCase,
    updateTestCase,
    removeTestCase,
    updateTestCaseResult,
    isTesting,
    setIsTesting,
    pythonCode,
  } = useLogicFlowStore();

  const [newTestCase, setNewTestCase] = useState({ name: "", input: "", expectedOutput: "" });
  const [editingTcId, setEditingTcId] = useState<string | null>(null);
  const [editTcValues, setEditTcValues] = useState({ name: "", input: "", expectedOutput: "" });
  const [autoGenWarning, setAutoGenWarning] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [useCodeOutputAsExpected, setUseCodeOutputAsExpected] = useState(true);
  const [lastGeneratedCount, setLastGeneratedCount] = useState(0);
  const [generationError, setGenerationError] = useState("");
  const [executionWarning, setExecutionWarning] = useState("");

  const handleAddTestCase = () => {
    if (!newTestCase.name.trim() || !newTestCase.input.trim() || !newTestCase.expectedOutput.trim()) return;
    addTestCase({
      id: `tc-${Date.now()}`,
      name: newTestCase.name.trim(),
      input: newTestCase.input.trim(),
      expectedOutput: newTestCase.expectedOutput.trim(),
      status: "PENDING",
    });
    setNewTestCase({ name: "", input: "", expectedOutput: "" });
  };

  const handleSaveTcEdit = () => {
    if (editingTcId && editTcValues.name.trim() && editTcValues.input.trim() && editTcValues.expectedOutput.trim()) {
      updateTestCase(editingTcId, {
        name: editTcValues.name.trim(),
        input: editTcValues.input.trim(),
        expectedOutput: editTcValues.expectedOutput.trim(),
      });
    }
    setEditingTcId(null);
  };

  const handleAutoGenerateTestCases = async () => {
    if (inputs.length === 0) {
      setAutoGenWarning("Please add inputs in Step 1 first.");
      setTimeout(() => setAutoGenWarning(""), 4000);
      return;
    }

    setAutoGenWarning("");
    setGenerationError("");
    setExecutionWarning("");
    setIsGenerating(true);

    // Regenerating replaces previously auto-generated cases (keeps manual ones)
    const existing = useLogicFlowStore.getState().testCases;
    existing
      .filter((tc) => tc.id.startsWith("tc-auto-"))
      .forEach((tc) => removeTestCase(tc.id));

    try {
      const { testCases: generated, warnings } = await generateTestCases(
        inputs,
        outputs,
        rules,
        problemStatement,
        pythonCode,
        useCodeOutputAsExpected
      );

      if (generated.length === 0) {
        setGenerationError("Could not generate test cases. Please check your inputs.");
        setTimeout(() => setGenerationError(""), 4000);
        return;
      }

      generated.forEach((tc) => addTestCase(tc));
      setLastGeneratedCount(generated.length);

      if (warnings.length > 0) {
        setExecutionWarning(warnings.join(" "));
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to generate test cases.";
      setGenerationError(message);
      setTimeout(() => setGenerationError(""), 4000);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRunTests = async (casesToRun?: TestCase[]) => {
    setIsTesting(true);

    const tests = casesToRun && casesToRun.length > 0 ? casesToRun : testCases;

    for (const test of tests) {
      updateTestCaseResult(test.id, "RUNNING");

      // Universal code executor: smartly detects the function to call (if any)
      // and builds the right wrapper for every style of user code - return-only,
      // print-only, both, multiple functions, input() based code, multi-line
      // output and plain scripts.
      const result = await runSmartPythonCode(pythonCode, test.input);

      const actualTrimmed = result.output.trim();
      const expectedTrimmed = test.expectedOutput.trim();

      const isMatch =
        actualTrimmed === expectedTrimmed ||
        (actualTrimmed !== "" &&
          expectedTrimmed !== "" &&
          !isNaN(Number(actualTrimmed)) &&
          !isNaN(Number(expectedTrimmed)) &&
          Number(actualTrimmed) === Number(expectedTrimmed));

      if (!result.error && isMatch) {
        updateTestCaseResult(test.id, "PASSED", result.output);
      } else {
        updateTestCaseResult(test.id, "FAILED", result.error || result.output);
      }
    }

    setIsTesting(false);
  };

  const handleGenerateAndRun = async () => {
    await handleAutoGenerateTestCases();
    const freshCases = useLogicFlowStore.getState().testCases;
    if (freshCases.length > 0) {
      await handleRunTests(freshCases);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 backdrop-blur space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block mb-1">
              STEP 5
            </span>
            <h2 className="text-xl font-bold text-white">In-Browser Code Testing</h2>
            <p className="text-xs text-slate-400 mt-1">
              Execute your logic with normal, boundary, and edge test cases to verify correctness.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleGenerateAndRun}
              disabled={isGenerating || isTesting}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer"
              title="Generate test cases and immediately run them"
            >
              {isGenerating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4 fill-current" />
              )}
              Generate & Run
            </button>
            <button
              onClick={handleAutoGenerateTestCases}
              disabled={isGenerating}
              className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer"
            >
              {isGenerating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4" />
              )}
              {isGenerating ? "Analyzing your code..." : "Auto-Generate"}
            </button>
            {testCases.length > 0 && (
              <button
                onClick={handleAutoGenerateTestCases}
                disabled={isGenerating}
                className="px-3 py-2.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                title="Regenerate test cases"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
                Regenerate
              </button>
            )}
            <button
              onClick={() => handleRunTests()}
              disabled={isTesting}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              {isTesting ? "Running..." : "Run Test Suite"}
            </button>
          </div>
        </div>

        {autoGenWarning && (
          <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-lg">
            <XCircle className="w-3.5 h-3.5 shrink-0" />
            {autoGenWarning}
          </div>
        )}

        {generationError && (
          <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-lg">
            <XCircle className="w-3.5 h-3.5 shrink-0" />
            {generationError}
          </div>
        )}

        {executionWarning && (
          <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-lg">
            <TriangleAlert className="w-3.5 h-3.5 shrink-0" />
            {executionWarning}
          </div>
        )}

        {/* Toggle for code output as expected */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-500/5 border border-blue-500/15 px-4 py-3 rounded-xl">
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={useCodeOutputAsExpected}
                onChange={(e) => setUseCodeOutputAsExpected(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
            </label>
            <div>
              <span className="text-xs font-semibold text-slate-200">
                Use code output as expected (Recommended)
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {useCodeOutputAsExpected
                  ? "Expected values auto-filled from your code execution."
                  : "⚠️ Assumes your code is correct. Manually verify expected values."}
              </p>
            </div>
          </div>
          {lastGeneratedCount > 0 && (
            <span className="text-[10px] text-slate-400 bg-slate-800/60 px-2 py-1 rounded-full">
              Last: {lastGeneratedCount} cases generated
            </span>
          )}
        </div>

        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
          <label className="text-xs font-semibold text-slate-300 block">Add New Test Case</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Test Name</label>
              <input
                type="text"
                value={newTestCase.name}
                onChange={(e) => setNewTestCase({ ...newTestCase, name: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleAddTestCase()}
                placeholder="e.g. Peak Hour Ride"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Input Parameters</label>
              <input
                type="text"
                value={newTestCase.input}
                onChange={(e) => setNewTestCase({ ...newTestCase, input: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleAddTestCase()}
                placeholder="e.g. distance=5, duration=15, peak=True"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Expected Output</label>
              <input
                type="text"
                value={newTestCase.expectedOutput}
                onChange={(e) => setNewTestCase({ ...newTestCase, expectedOutput: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleAddTestCase()}
                placeholder="e.g. 275.0"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
          <button
            onClick={handleAddTestCase}
            className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Test Case
          </button>
        </div>

        {testCases.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl bg-slate-950/40 text-center">
            No test cases yet. Add your first test case above to get started.
          </div>
        ) : (
          <>
            {/* Info banner */}
            {lastGeneratedCount > 0 && (
              <div className="flex items-center gap-2 text-xs text-cyan-300 bg-cyan-500/5 border border-cyan-500/15 px-4 py-2.5 rounded-xl mb-3">
                <span className="text-sm">💡</span>
                <span>
                  {lastGeneratedCount} test cases generated from your problem analysis.
                  {useCodeOutputAsExpected
                    ? " Expected values auto-filled from your code. Edit any to test differently."
                    : " Fill expected values manually to match your logic."}
                </span>
              </div>
            )}
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-900/50">
                  <th className="p-3.5">Test Case</th>
                  <th className="p-3.5">Input</th>
                  <th className="p-3.5">Expected Output</th>
                  <th className="p-3.5">Source</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {testCases.map((tc) => (
                  <tr key={tc.id} className="hover:bg-slate-900/30 transition-colors">
                    {editingTcId === tc.id ? (
                      <>
                        <td className="p-2">
                          <input
                            type="text"
                            value={editTcValues.name}
                            onChange={(e) => setEditTcValues({ ...editTcValues, name: e.target.value })}
                            className="w-full bg-slate-900 border border-cyan-500 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={editTcValues.input}
                            onChange={(e) => setEditTcValues({ ...editTcValues, input: e.target.value })}
                            className="w-full bg-slate-900 border border-cyan-500 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={editTcValues.expectedOutput}
                            onChange={(e) => setEditTcValues({ ...editTcValues, expectedOutput: e.target.value })}
                            className="w-full bg-slate-900 border border-cyan-500 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none"
                          />
                        </td>
                        <td className="p-2 text-slate-400">Editing...</td>
                        <td className="p-2">
                          <div className="flex gap-1">
                            <button
                              onClick={handleSaveTcEdit}
                              className="text-emerald-400 hover:text-emerald-300 p-1 cursor-pointer"
                              title="Save"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingTcId(null)}
                              className="text-slate-400 hover:text-slate-300 p-1 cursor-pointer"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-3.5 font-semibold text-slate-200">
                          <div className="flex items-center gap-2">
                            {tc.name}
                          </div>
                        </td>
                        <td className="p-3.5 font-mono text-cyan-300 whitespace-pre-wrap">{tc.input}</td>
                        <td className="p-3.5 font-mono text-emerald-300">{tc.expectedOutput}</td>
                        <td className="p-3.5">
                          <TestSourceBadge source={tc.source} />
                        </td>
                        <td className="p-3.5">
                          {tc.status === "PASSED" && (
                            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" /> PASSED
                            </span>
                          )}
                          {tc.status === "FAILED" && (
                            <span className="inline-flex items-center gap-1.5 text-rose-400 font-bold bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-full text-[11px]">
                              <XCircle className="w-3.5 h-3.5" /> FAILED
                            </span>
                          )}
                          {tc.status === "RUNNING" && (
                            <span className="inline-flex items-center gap-1.5 text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full text-[11px] animate-pulse">
                              <Clock className="w-3.5 h-3.5" /> RUNNING
                            </span>
                          )}
                          {tc.status === "PENDING" && (
                            <span className="inline-flex items-center gap-1.5 text-slate-400 font-medium bg-slate-800/60 border border-slate-700/50 px-2.5 py-1 rounded-full text-[11px]">
                              PENDING
                            </span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setEditingTcId(tc.id);
                                setEditTcValues({ name: tc.name, input: tc.input, expectedOutput: tc.expectedOutput });
                              }}
                              className="text-cyan-400 hover:text-white p-1 cursor-pointer transition-colors"
                              title="Edit Test Case"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => removeTestCase(tc.id)}
                              className="text-cyan-400 hover:text-rose-400 p-1 cursor-pointer transition-colors"
                              title="Delete Test Case"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}

        <div className="flex justify-between pt-2">
          <button
            onClick={() => setCurrentStep(4)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all cursor-pointer"
          >
            Back to Step 4
          </button>
          <button
            onClick={() => setCurrentStep(6)}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer"
          >
            Next: Optimization
          </button>
        </div>
      </div>
    </div>
  );
};

export default Step5Testing;