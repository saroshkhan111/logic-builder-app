"use client";

import { Check, Edit2, Plus, Trash2, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

import { StepFieldValidation } from "@/components/validation/StepFieldValidation";
import { GhostInput, GhostTextArea } from "@/components/GhostInput"; // Note: GhostTextArea will be imported
import { useLogicFlowStore } from "@/store/logicFlowStore";
import { useGhostSuggestion } from "@/lib/useGhostSuggestion";

export const Step1Problem = () => {
  const {
    setCurrentStep,
    problemStatement,
    setProblemStatement,
    inputs,
    addInputItem,
    updateInputItem,
    removeInputItem,
    outputs,
    addOutputItem,
    updateOutputItem,
    removeOutputItem,
    rules,
    addRule,
    updateRule,
    removeRule,
  } = useLogicFlowStore();

  const [ruleVal, setRuleVal] = useState("");
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editRuleValue, setEditRuleValue] = useState("");

  const [inputVal, setInputVal] = useState("");
  const [outputVal, setOutputVal] = useState("");

  const [editingInputId, setEditingInputId] = useState<string | null>(null);
  const [editInputValue, setEditInputValue] = useState("");

  const [editingOutputId, setEditingOutputId] = useState<string | null>(null);
  const [editOutputValue, setEditOutputValue] = useState("");

  // Ghost Suggestions logic
  const { suggestion: problemSuggestion } = useGhostSuggestion(1, problemStatement, {});

  // Auto-resize textarea ref + effect
  const problemTextareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = problemTextareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [problemStatement]);

  const handleAddInput = () => {
    if (!inputVal.trim()) return;
    addInputItem(inputVal.trim());
    setInputVal("");
  };

  const handleAddOutput = () => {
    if (!outputVal.trim()) return;
    addOutputItem(outputVal.trim());
    setOutputVal("");
  };

  const handleAddRule = () => {
    if (!ruleVal.trim()) return;
    addRule(ruleVal.trim());
    setRuleVal("");
  };

  const handleSaveRuleEdit = (id: string) => {
    if (editRuleValue.trim()) {
      updateRule(id, editRuleValue.trim());
    }
    setEditingRuleId(null);
  };

  const handleRemoveRule = (id: string) => {
    removeRule(id);
  };

  const handleSaveInputEdit = (id: string) => {
    if (editInputValue.trim()) updateInputItem(id, editInputValue.trim());
    setEditingInputId(null);
  };

  const handleSaveOutputEdit = (id: string) => {
    if (editOutputValue.trim()) updateOutputItem(id, editOutputValue.trim());
    setEditingOutputId(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 backdrop-blur space-y-6">
        <div className="mb-4">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">
            STEP 1
          </span>
          <h2 className="text-xl font-bold text-white">
            Problem Statement & Understanding
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Describe what you want to solve in simple language. Identify inputs, outputs, and any special conditions or constraints.
          </p>
        </div>

        {/* Problem Statement Area - Integrated with GhostTextArea */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
          <label className="text-xs font-semibold text-slate-300 block">
            What is the problem you want to solve?
          </label>
          {/* Replacing textarea with GhostTextArea */}
          <div className="relative">
            <textarea
              ref={problemTextareaRef}
              value={problemStatement}
              onChange={(e) => setProblemStatement(e.target.value)}
              placeholder="Example: Write a program that takes an integer and checks if it is Even or Odd..."
              className="w-full min-h-25 bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none overflow-hidden leading-relaxed"
            />
            {problemSuggestion && (
               <div className="absolute bottom-2 right-3 text-[10px] text-indigo-400 italic animate-pulse pointer-events-none">
                 AI Suggestion available...
               </div>
            )}
          </div>
        </div>

        {/* 3-Column Grid: Inputs, Outputs, Conditions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 *:min-w-0">
          {/* Inputs Panel */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-4">
            <label className="text-xs font-semibold text-slate-300 block">
              Inputs (What data is received?)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddInput()}
                placeholder="e.g. num (Integer)"
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddInput}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {inputs.map((item, idx) =>
                editingInputId === item.id ? (
                  <div key={item.id} className="flex items-center gap-1 bg-slate-900 border border-indigo-500 rounded-lg p-1 text-xs z-10">
                    <input
                      type="text"
                      value={editInputValue}
                      onChange={(e) => setEditInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveInputEdit(item.id);
                        if (e.key === "Escape") setEditingInputId(null);
                      }}
                      autoFocus
                      className="bg-transparent text-slate-100 text-xs focus:outline-none px-1 w-24"
                    />
                    <button type="button" onClick={() => handleSaveInputEdit(item.id)} className="text-emerald-400 p-0.5 cursor-pointer">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => setEditingInputId(null)} className="text-slate-400 p-0.5 cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <span key={item.id} className="inline-flex items-center gap-2 bg-indigo-950/50 border border-indigo-800/60 text-indigo-300 px-2.5 py-1 rounded-lg text-xs font-mono group">
                    <span className="text-indigo-400 font-mono font-bold mr-1">
                      {idx + 1}.
                    </span>
                    {item.value}
                    <div className="flex items-center gap-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button" onClick={() => { setEditingInputId(item.id); setEditInputValue(item.value); }} className="text-indigo-400 hover:text-white cursor-pointer p-0.5">
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button type="button" onClick={() => removeInputItem(item.id)} className="text-indigo-400 hover:text-rose-400 cursor-pointer p-0.5">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </span>
                )
              )}
            </div>
          </div>

          {/* Outputs Panel */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-4">
            <label className="text-xs font-semibold text-slate-300 block">
              Outputs (What should be produced?)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={outputVal}
                onChange={(e) => setOutputVal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddOutput()}
                placeholder='e.g. "Even" or "Odd"'
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddOutput}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {outputs.map((item, idx) =>
                editingOutputId === item.id ? (
                  <div key={item.id} className="flex items-center gap-1 bg-slate-900 border border-emerald-500 rounded-lg p-1 text-xs z-10">
                    <input
                      type="text"
                      value={editOutputValue}
                      onChange={(e) => setEditOutputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveOutputEdit(item.id);
                        if (e.key === "Escape") setEditingOutputId(null);
                      }}
                      autoFocus
                      className="bg-transparent text-slate-100 text-xs focus:outline-none px-1 w-24"
                    />
                    <button type="button" onClick={() => handleSaveOutputEdit(item.id)} className="text-emerald-400 p-0.5 cursor-pointer">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => setEditingOutputId(null)} className="text-slate-400 p-0.5 cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <span key={item.id} className="inline-flex items-center gap-2 bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 px-2.5 py-1 rounded-lg text-xs font-mono group">
                    <span className="text-indigo-400 font-mono font-bold mr-1">
                      {idx + 1}.
                    </span>
                    {item.value}
                    <div className="flex items-center gap-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button" onClick={() => { setEditingOutputId(item.id); setEditOutputValue(item.value); }} className="text-emerald-400 hover:text-white cursor-pointer p-0.5">
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button type="button" onClick={() => removeOutputItem(item.id)} className="text-emerald-400 hover:text-rose-400 cursor-pointer p-0.5">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </span>
                )
              )}
            </div>
          </div>

          {/* Conditions / Restrictions Panel */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-4">
            <label className="text-xs font-semibold text-slate-300 block">
              Conditions / Restrictions (What rules apply?)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={ruleVal}
                onChange={(e) => setRuleVal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddRule()}
                placeholder="e.g. num must be > 0"
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddRule}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {rules.map((item, idx) =>
                editingRuleId === item.id ? (
                  <div key={item.id} className="flex items-center gap-1 bg-slate-900 border border-amber-500 rounded-lg p-1 text-xs z-10">
                    <input
                      type="text"
                      value={editRuleValue}
                      onChange={(e) => setEditRuleValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveRuleEdit(item.id);
                        if (e.key === "Escape") setEditingRuleId(null);
                      }}
                      autoFocus
                      className="bg-transparent text-slate-100 text-xs focus:outline-none px-1 w-24"
                    />
                    <button type="button" onClick={() => handleSaveRuleEdit(item.id)} className="text-emerald-400 p-0.5 cursor-pointer">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => setEditingRuleId(null)} className="text-slate-400 p-0.5 cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <span key={item.id} className="inline-flex items-center gap-2 bg-amber-950/50 border border-amber-800/60 text-amber-300 px-2.5 py-1 rounded-lg text-xs font-mono group">
                    <span className="text-indigo-400 font-mono font-bold mr-1">
                      {idx + 1}.
                    </span>
                    {item.value}
                    <div className="flex items-center gap-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button" onClick={() => { setEditingRuleId(item.id); setEditRuleValue(item.value); }} className="text-amber-400 hover:text-white cursor-pointer p-0.5">
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button type="button" onClick={() => handleRemoveRule(item.id)} className="text-amber-400 hover:text-rose-400 cursor-pointer p-0.5">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </span>
                )
              )}
            </div>
          </div>
        </div>

        {/* AI sequence check + navigation */}
        <StepFieldValidation
          step={1}
          problemStatement={problemStatement}
          fields={[
            {
              key: "problemStatement",
              label: "Problem Statement",
              value: problemStatement,
            },
            { key: "inputs", label: "Inputs", value: inputs.map((i) => i.value).join(", ") },
            { key: "outputs", label: "Outputs", value: outputs.map((i) => i.value).join(", ") },
            { key: "rules", label: "Rules", value: rules.map((i) => i.value).join(", ") },
          ]}
          continueLabel="Next: Requirements Analysis"
          onContinue={() => setCurrentStep(2)}
        />
      </div>
    </div>
  );
};
