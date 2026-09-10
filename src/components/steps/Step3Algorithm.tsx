"use client";

import { Check, Edit2, GitBranch, Plus, Sparkles, Terminal, Trash2, X } from "lucide-react";
import { useState } from "react";

import FlowChart from "@/components/flow/FlowChart";
import { parseAlgorithm } from "@/lib/algorithmParser";
import { useLogicFlowStore } from "@/store/logicFlowStore";

export const Step3Algorithm = () => {
  const {
    setCurrentStep,
    algorithm,
    setAlgorithm,
    pseudocodeSteps,
    addPseudocodeStep,
    updatePseudocodeStep,
    removePseudocodeStep,
  } = useLogicFlowStore();

  const [pseudoInput, setPseudoInput] = useState("");
  const [editingPseudoIdx, setEditingPseudoIdx] = useState<number | null>(null);
  const [editPseudoValue, setEditPseudoValue] = useState("");

  const handleAddPseudo = () => {
    if (!pseudoInput.trim()) return;
    addPseudocodeStep(pseudoInput.trim());
    setPseudoInput("");
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 backdrop-blur space-y-6">
        <div>
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">
            STEP 3
          </span>
          <h2 className="text-xl font-bold text-white">
            Algorithm Design, Pseudocode & Flowchart
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Write your algorithm one line at a time. Add individual pseudocode steps below.
            A flowchart will be generated automatically.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Column 1 - Algorithm Writer */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs">
              <Terminal className="w-4 h-4" /> 1. Algorithm Writer
            </div>
            <textarea
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              placeholder={"START\n1. Create two variables.\n2. Assign them hardcoded values.\n3. INPUT a and b\n4. IF a > b\n5. Compute a + b\n6. DISPLAY result\nEND"}
              className="w-full h-48 bg-slate-900 border border-slate-800 rounded-lg p-3 font-mono text-xs text-emerald-400 focus:outline-none focus:border-indigo-500 resize-y leading-relaxed"
            />
          </div>

          {/* Column 2 - Pseudocode Steps with CRUD */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-sky-400 font-semibold text-xs">
              <Sparkles className="w-4 h-4" /> 2. Pseudocode Steps
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={pseudoInput}
                onChange={(e) => setPseudoInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddPseudo()}
                placeholder="e.g. Initialize score to 0"
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleAddPseudo}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
            <div className="space-y-1.5 pt-1 max-h-48 overflow-y-auto">
              {pseudocodeSteps.map((item, idx) =>
                editingPseudoIdx === idx ? (
                  <div
                    key={idx}
                    className="flex items-center gap-1 bg-slate-900 border border-sky-500 rounded-lg p-1 text-xs"
                  >
                    <span className="text-sky-400 font-mono text-xs px-1">{idx + 1}.</span>
                    <input
                      type="text"
                      value={editPseudoValue}
                      onChange={(e) => setEditPseudoValue(e.target.value)}
                      className="bg-transparent text-slate-100 text-xs focus:outline-none px-1 flex-1"
                    />
                    <button
                      onClick={() => {
                        if (editPseudoValue.trim()) {
                          updatePseudocodeStep(idx, editPseudoValue.trim());
                        }
                        setEditingPseudoIdx(null);
                      }}
                      className="text-emerald-400 hover:text-emerald-300 p-0.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingPseudoIdx(null)}
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
                    <span className="text-sky-400 font-mono font-bold">{idx + 1}.</span>
                    <span className="text-sky-300 font-mono flex-1">{item}</span>
                    <button
                      onClick={() => {
                        setEditingPseudoIdx(idx);
                        setEditPseudoValue(item);
                      }}
                      className="text-sky-400 hover:text-white transition-colors cursor-pointer"
                      title="Edit Step"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removePseudocodeStep(idx)}
                      className="text-sky-400 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete Step"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Column 3 - Live Flowchart */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs">
                <GitBranch className="w-4 h-4" /> 3. Live Flowchart
              </div>
              <div className="flex gap-2 text-[10px] text-slate-500">
                <span>Start/End</span>
                <span>Input/Output</span>
                <span>Decision</span>
              </div>
            </div>
            <FlowChart nodes={parseAlgorithm(algorithm)} />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-2">
          <button
            onClick={() => setCurrentStep(2)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all cursor-pointer"
          >
            Back to Step 2
          </button>
          <button
            onClick={() => setCurrentStep(4)}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer"
          >
            Next: Code Writing
          </button>
        </div>
      </div>
    </div>
  );
};

export default Step3Algorithm;
