"use client";

import { ArrowRight, Check, Edit2, Plus, Trash2, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

import { useLogicFlowStore } from "@/store/logicFlowStore";

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
  const [editingRuleIdx, setEditingRuleIdx] = useState<number | null>(null);
  const [editRuleValue, setEditRuleValue] = useState("");

  const [inputVal, setInputVal] = useState("");
  const [outputVal, setOutputVal] = useState("");

  const [editingInputIdx, setEditingInputIdx] = useState<number | null>(null);
  const [editInputValue, setEditInputValue] = useState("");

  const [editingOutputIdx, setEditingOutputIdx] = useState<number | null>(null);
  const [editOutputValue, setEditOutputValue] = useState("");

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

  const handleSaveRuleEdit = (index: number) => {
    if (editRuleValue.trim()) {
      updateRule(index, editRuleValue.trim());
    }
    setEditingRuleIdx(null);
  };

  const handleRemoveRule = (index: number) => {
    removeRule(index);
  };

  const handleSaveInputEdit = (index: number) => {
    if (editInputValue.trim()) updateInputItem(index, editInputValue.trim());
    setEditingInputIdx(null);
  };

  const handleSaveOutputEdit = (index: number) => {
    if (editOutputValue.trim()) updateOutputItem(index, editOutputValue.trim());
    setEditingOutputIdx(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 backdrop-blur space-y-6">
        <div>
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

        {/* Problem Statement Area */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
          <label className="text-xs font-semibold text-slate-300 block">
            What is the problem you want to solve?
          </label>
          <textarea
            ref={problemTextareaRef}
            value={problemStatement}
            onChange={(e) => setProblemStatement(e.target.value)}
            placeholder="Example: Write a program that takes an integer and checks if it is Even or Odd..."
            className="w-full min-h-25 bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none overflow-hidden leading-relaxed"
          />
        </div>

        {/* 3-Column Grid: Inputs, Outputs, Conditions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                onClick={handleAddInput}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {inputs.map((item, idx) =>
                editingInputIdx === idx ? (
                  <div key={idx} className="flex items-center gap-1 bg-slate-900 border border-indigo-500 rounded-lg p-1 text-xs">
                    <input
                      type="text"
                      value={editInputValue}
                      onChange={(e) => setEditInputValue(e.target.value)}
                      className="bg-transparent text-slate-100 text-xs focus:outline-none px-1 w-24"
                    />
                    <button onClick={() => handleSaveInputEdit(idx)} className="text-emerald-400 p-0.5 cursor-pointer">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setEditingInputIdx(null)} className="text-slate-400 p-0.5 cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <span key={idx} className="inline-flex items-center gap-2 bg-indigo-950/50 border border-indigo-800/60 text-indigo-300 px-2.5 py-1 rounded-lg text-xs font-mono">
                    {item}
                    <button onClick={() => { setEditingInputIdx(idx); setEditInputValue(item); }} className="text-indigo-400 hover:text-white cursor-pointer">
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button onClick={() => removeInputItem(idx)} className="text-indigo-400 hover:text-rose-400 cursor-pointer">
                      <Trash2 className="w-3 h-3" />
                    </button>
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
                onClick={handleAddOutput}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {outputs.map((item, idx) =>
                editingOutputIdx === idx ? (
                  <div key={idx} className="flex items-center gap-1 bg-slate-900 border border-emerald-500 rounded-lg p-1 text-xs">
                    <input
                      type="text"
                      value={editOutputValue}
                      onChange={(e) => setEditOutputValue(e.target.value)}
                      className="bg-transparent text-slate-100 text-xs focus:outline-none px-1 w-24"
                    />
                    <button onClick={() => handleSaveOutputEdit(idx)} className="text-emerald-400 p-0.5 cursor-pointer">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setEditingOutputIdx(null)} className="text-slate-400 p-0.5 cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <span key={idx} className="inline-flex items-center gap-2 bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 px-2.5 py-1 rounded-lg text-xs font-mono">
                    {item}
                    <button onClick={() => { setEditingOutputIdx(idx); setEditOutputValue(item); }} className="text-emerald-400 hover:text-white cursor-pointer">
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button onClick={() => removeOutputItem(idx)} className="text-emerald-400 hover:text-rose-400 cursor-pointer">
                      <Trash2 className="w-3 h-3" />
                    </button>
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
                onClick={handleAddRule}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {rules.map((item, idx) =>
                editingRuleIdx === idx ? (
                  <div key={idx} className="flex items-center gap-1 bg-slate-900 border border-amber-500 rounded-lg p-1 text-xs">
                    <input
                      type="text"
                      value={editRuleValue}
                      onChange={(e) => setEditRuleValue(e.target.value)}
                      className="bg-transparent text-slate-100 text-xs focus:outline-none px-1 w-24"
                    />
                    <button onClick={() => handleSaveRuleEdit(idx)} className="text-emerald-400 p-0.5 cursor-pointer">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setEditingRuleIdx(null)} className="text-slate-400 p-0.5 cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <span key={idx} className="inline-flex items-center gap-2 bg-amber-950/50 border border-amber-800/60 text-amber-300 px-2.5 py-1 rounded-lg text-xs font-mono">
                    {item}
                    <button onClick={() => { setEditingRuleIdx(idx); setEditRuleValue(item); }} className="text-amber-400 hover:text-white cursor-pointer">
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button onClick={() => handleRemoveRule(idx)} className="text-amber-400 hover:text-rose-400 cursor-pointer">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                )
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-end pt-2">
          <button
            onClick={() => setCurrentStep(2)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer"
          >
            Next: Requirements Analysis <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};