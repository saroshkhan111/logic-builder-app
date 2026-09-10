"use client";

import { Check, CheckCircle2, Clock, Edit2, Play, Plus, Trash2, X, XCircle } from "lucide-react";
import { useState } from "react";

import { runPythonCode } from "@/lib/pyodide/runner";
import { useLogicFlowStore } from "@/store/logicFlowStore";

export const Step5Testing = () => {
  const {
    setCurrentStep,
    testCases,
    addTestCase,
    updateTestCase,
    removeTestCase,
    updateTestCaseResult,
    isTesting,
    setIsTesting,
  } = useLogicFlowStore();

  const [newTestCase, setNewTestCase] = useState({ name: "", input: "", expectedOutput: "" });
  const [editingTcId, setEditingTcId] = useState<string | null>(null);
  const [editTcValues, setEditTcValues] = useState({ name: "", input: "", expectedOutput: "" });

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

  const handleRunTests = async () => {
    setIsTesting(true);

    const userCode = `
num = int(input())
if num % 2 == 0:
    print("Even")
else:
    print("Odd")
`;

    for (const test of testCases) {
      updateTestCaseResult(test.id, "RUNNING");
      const result = await runPythonCode(userCode, test.input);

      if (!result.error && result.output === test.expectedOutput) {
        updateTestCaseResult(test.id, "PASSED", result.output);
      } else {
        updateTestCaseResult(test.id, "FAILED", result.error || result.output);
      }
    }

    setIsTesting(false);
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
          <button
            onClick={handleRunTests}
            disabled={isTesting}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            {isTesting ? "Running..." : "Run Test Suite"}
          </button>
        </div>

        {/* Add New Test Case Form */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
          <label className="text-xs font-semibold text-slate-300 block">Add New Test Case</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              value={newTestCase.name}
              onChange={(e) => setNewTestCase({ ...newTestCase, name: e.target.value })}
              placeholder="e.g. Test Input: 85, Expected: Passed"
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
            <input
              type="text"
              value={newTestCase.input}
              onChange={(e) => setNewTestCase({ ...newTestCase, input: e.target.value })}
              placeholder="e.g. -5"
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
            <input
              type="text"
              value={newTestCase.expectedOutput}
              onChange={(e) => setNewTestCase({ ...newTestCase, expectedOutput: e.target.value })}
              placeholder="e.g. Odd"
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            onClick={handleAddTestCase}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Test Case
          </button>
        </div>

        {/* Test Cases Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-900/50">
                <th className="p-3.5">Test Case</th>
                <th className="p-3.5">Input</th>
                <th className="p-3.5">Expected Output</th>
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
                      <td className="p-3.5 font-semibold text-slate-200">{tc.name}</td>
                      <td className="p-3.5 font-mono text-cyan-300">{tc.input}</td>
                      <td className="p-3.5 font-mono text-emerald-300">{tc.expectedOutput}</td>
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

        {/* Navigation */}
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
