"use client";

import { Check, CheckCircle2, Edit2, Gauge, ListChecks, Plus, RotateCcw, Trash2, Wand2, X } from "lucide-react";
import { useState } from "react";

import { useLogicFlowStore } from "@/store/logicFlowStore";

export const Step6Optimization = () => {
  const {
    setCurrentStep,
    problemStatement,
    inputs,
    outputs,
    requiredData,
    toolsFunctions,
    logicalConcepts,
    algorithm,
    fileName,
    optimizationRules,
    addOptimizationRule,
    updateOptimizationRule,
    removeOptimizationRule,
    reset,
  } = useLogicFlowStore();

  const [ruleInput, setRuleInput] = useState("");
  const [editingRuleIdx, setEditingRuleIdx] = useState<number | null>(null);
  const [editRuleValue, setEditRuleValue] = useState("");

  const handleAddRule = () => {
    if (!ruleInput.trim()) return;
    addOptimizationRule(ruleInput.trim());
    setRuleInput("");
  };

  const summaryItems = [
    { label: "Problem Statement", value: problemStatement.trim() || "Not defined yet (Step 1)" },
    { label: "Inputs", value: inputs.length > 0 ? inputs.join(", ") : "None added (Step 1)" },
    { label: "Outputs", value: outputs.length > 0 ? outputs.join(", ") : "None added (Step 1)" },
    {
      label: "Requirements",
      value:
        requiredData.length + toolsFunctions.length + logicalConcepts.length > 0
          ? `${requiredData.length} data, ${toolsFunctions.length} tools, ${logicalConcepts.length} skills`
          : "None added (Step 2)",
    },
    { label: "Algorithm", value: algorithm.trim() ? `${algorithm.trim().split("\n").length} lines drafted` : "Empty (Step 3)" },
    { label: "Final File", value: fileName || "my_logic.py" },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 backdrop-blur space-y-6">
        <div>
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">
            STEP 6
          </span>
          <h2 className="text-xl font-bold text-white">Optimization & Refactoring</h2>
          <p className="text-xs text-slate-400 mt-1">
            Polish your code for efficiency and readability, then review your finished problem-solving workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Optimization Rules with CRUD */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs">
              <Wand2 className="w-4 h-4" /> Optimization Rules
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={ruleInput}
                onChange={(e) => setRuleInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddRule()}
                placeholder="e.g. Replace repeated code with functions"
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleAddRule}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
            <div className="space-y-1.5 pt-1">
              {optimizationRules.map((item, idx) =>
                editingRuleIdx === idx ? (
                  <div
                    key={idx}
                    className="flex items-center gap-1 bg-slate-900 border border-amber-500 rounded-lg p-1 text-xs"
                  >
                    <input
                      type="text"
                      value={editRuleValue}
                      onChange={(e) => setEditRuleValue(e.target.value)}
                      className="bg-transparent text-slate-100 text-xs focus:outline-none px-1 flex-1"
                    />
                    <button
                      onClick={() => {
                        if (editRuleValue.trim()) {
                          updateOptimizationRule(idx, editRuleValue.trim());
                        }
                        setEditingRuleIdx(null);
                      }}
                      className="text-emerald-400 hover:text-emerald-300 p-0.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingRuleIdx(null)}
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
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-slate-300 flex-1">{item}</span>
                    <button
                      onClick={() => {
                        setEditingRuleIdx(idx);
                        setEditRuleValue(item);
                      }}
                      className="text-amber-400 hover:text-white transition-colors cursor-pointer"
                      title="Edit Rule"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeOptimizationRule(idx)}
                      className="text-amber-400 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete Rule"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )
              )}
            </div>
            {optimizationRules.length === 0 && (
              <div className="flex items-start gap-2 text-xs text-slate-400 pt-1">
                <Gauge className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                Review your algorithm for redundant loops - aim for the simplest path where possible.
              </div>
            )}
          </div>

          {/* Project Summary */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs">
              <ListChecks className="w-4 h-4" /> Project Summary
            </div>
            <div className="space-y-1.5">
              {summaryItems.map((item) => (
                <div
                  key={item.label}
                  className="text-xs bg-slate-900/80 text-slate-300 p-2.5 rounded-lg border border-slate-800"
                >
                  <span className="text-indigo-300 font-semibold">{item.label}: </span>
                  {item.value}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-2">
          <button
            onClick={() => setCurrentStep(5)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all cursor-pointer"
          >
            Back to Step 5
          </button>
          <button
            onClick={() => {
              reset();
              setCurrentStep(1);
            }}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> Start a New Problem
          </button>
        </div>
      </div>
    </div>
  );
};

export default Step6Optimization;
