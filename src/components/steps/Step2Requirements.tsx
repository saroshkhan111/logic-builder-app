"use client";

import { ArrowRight, Check, Edit2, Plus, Trash2, X } from "lucide-react";
import React, { useState } from "react";

import { useLogicFlowStore } from "@/store/logicFlowStore";

export const Step2Requirements = () => {
  const {
    setCurrentStep,
    requiredData,
    addRequiredData,
    updateRequiredData,
    removeRequiredData,
    toolsFunctions,
    addToolsFunction,
    updateToolsFunction,
    removeToolsFunction,
    logicalConcepts,
    addLogicalConcept,
    updateLogicalConcept,
    removeLogicalConcept,
  } = useLogicFlowStore();

  // Required Data state
  const [dataInput, setDataInput] = useState("");
  const [editingDataIdx, setEditingDataIdx] = useState<number | null>(null);
  const [editDataValue, setEditDataValue] = useState("");

  // Tools & Functions state
  const [toolInput, setToolInput] = useState("");
  const [editingToolIdx, setEditingToolIdx] = useState<number | null>(null);
  const [editToolValue, setEditToolValue] = useState("");

  // Logical Concepts state
  const [skillInput, setSkillInput] = useState("");
  const [editingSkillIdx, setEditingSkillIdx] = useState<number | null>(null);
  const [editSkillValue, setEditSkillValue] = useState("");

  const handleAddData = () => {
    if (!dataInput.trim()) return;
    addRequiredData(dataInput.trim());
    setDataInput("");
  };

  const handleAddTool = () => {
    if (!toolInput.trim()) return;
    addToolsFunction(toolInput.trim());
    setToolInput("");
  };

  const handleAddSkill = () => {
    if (!skillInput.trim()) return;
    addLogicalConcept(skillInput.trim());
    setSkillInput("");
  };

  const handleSaveDataEdit = (index: number) => {
    if (editDataValue.trim()) updateRequiredData(index, editDataValue.trim());
    setEditingDataIdx(null);
  };

  const handleSaveToolEdit = (index: number) => {
    if (editToolValue.trim()) updateToolsFunction(index, editToolValue.trim());
    setEditingToolIdx(null);
  };

  const handleSaveSkillEdit = (index: number) => {
    if (editSkillValue.trim()) updateLogicalConcept(index, editSkillValue.trim());
    setEditingSkillIdx(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 backdrop-blur space-y-6">
        <div>
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">
            STEP 2
          </span>
          <h2 className="text-xl font-bold text-white">Requirements Analysis</h2>
          <p className="text-xs text-slate-400 mt-1">
            Identify all necessary data types, tools, and logical skills required to solve this problem.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Required Data Panel */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-4">
            <label className="text-xs font-semibold text-slate-300 block">
              Required Data (What information do you need?)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={dataInput}
                onChange={(e) => setDataInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddData()}
                placeholder="e.g. current_year (number)"
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleAddData}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {requiredData.map((item, idx) =>
                editingDataIdx === idx ? (
                  <div key={idx} className="flex items-center gap-1 bg-slate-900 border border-indigo-500 rounded-lg p-1 text-xs">
                    <input
                      type="text"
                      value={editDataValue}
                      onChange={(e) => setEditDataValue(e.target.value)}
                      className="bg-transparent text-slate-100 text-xs focus:outline-none px-1 w-24"
                    />
                    <button onClick={() => handleSaveDataEdit(idx)} className="text-emerald-400 p-0.5 cursor-pointer">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setEditingDataIdx(null)} className="text-slate-400 p-0.5 cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <span key={idx} className="inline-flex items-center gap-2 bg-indigo-950/50 border border-indigo-800/60 text-indigo-300 px-2.5 py-1 rounded-lg text-xs font-mono">
                    {item}
                    <button onClick={() => { setEditingDataIdx(idx); setEditDataValue(item); }} className="text-indigo-400 hover:text-white cursor-pointer">
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button onClick={() => removeRequiredData(idx)} className="text-indigo-400 hover:text-rose-400 cursor-pointer">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                )
              )}
            </div>
          </div>

          {/* Tools & Functions Panel */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-4">
            <label className="text-xs font-semibold text-slate-300 block">
              Tools & Functions (What operations can you use?)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={toolInput}
                onChange={(e) => setToolInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTool()}
                placeholder="e.g. Subtraction operator (-)"
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleAddTool}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {toolsFunctions.map((item, idx) =>
                editingToolIdx === idx ? (
                  <div key={idx} className="flex items-center gap-1 bg-slate-900 border border-amber-500 rounded-lg p-1 text-xs">
                    <input
                      type="text"
                      value={editToolValue}
                      onChange={(e) => setEditToolValue(e.target.value)}
                      className="bg-transparent text-slate-100 text-xs focus:outline-none px-1 w-24"
                    />
                    <button onClick={() => handleSaveToolEdit(idx)} className="text-emerald-400 p-0.5 cursor-pointer">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setEditingToolIdx(null)} className="text-slate-400 p-0.5 cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <span key={idx} className="inline-flex items-center gap-2 bg-amber-950/50 border border-amber-800/60 text-amber-300 px-2.5 py-1 rounded-lg text-xs font-mono">
                    {item}
                    <button onClick={() => { setEditingToolIdx(idx); setEditToolValue(item); }} className="text-amber-400 hover:text-white cursor-pointer">
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button onClick={() => removeToolsFunction(idx)} className="text-amber-400 hover:text-rose-400 cursor-pointer">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                )
              )}
            </div>
          </div>

          {/* Logical Concepts Panel */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-4">
            <label className="text-xs font-semibold text-slate-300 block">
              Logical Concepts (What thinking patterns apply?)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddSkill()}
                placeholder="e.g. IF/ELSE condition check"
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleAddSkill}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {logicalConcepts.map((item, idx) =>
                editingSkillIdx === idx ? (
                  <div key={idx} className="flex items-center gap-1 bg-slate-900 border border-emerald-500 rounded-lg p-1 text-xs">
                    <input
                      type="text"
                      value={editSkillValue}
                      onChange={(e) => setEditSkillValue(e.target.value)}
                      className="bg-transparent text-slate-100 text-xs focus:outline-none px-1 w-24"
                    />
                    <button onClick={() => handleSaveSkillEdit(idx)} className="text-emerald-400 p-0.5 cursor-pointer">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setEditingSkillIdx(null)} className="text-slate-400 p-0.5 cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <span key={idx} className="inline-flex items-center gap-2 bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 px-2.5 py-1 rounded-lg text-xs font-mono">
                    {item}
                    <button onClick={() => { setEditingSkillIdx(idx); setEditSkillValue(item); }} className="text-emerald-400 hover:text-white cursor-pointer">
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button onClick={() => removeLogicalConcept(idx)} className="text-emerald-400 hover:text-rose-400 cursor-pointer">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                )
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-2">
          <button
            onClick={() => setCurrentStep(1)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all cursor-pointer"
          >
            Back to Step 1
          </button>
          <button
            onClick={() => setCurrentStep(3)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer"
          >
            Next: Algorithm Design <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Step2Requirements;
