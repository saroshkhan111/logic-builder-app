"use client";

import { Check, Edit2, Plus, Trash2, X } from "lucide-react";
import React, { useState } from "react";

import { ReferencePanel } from "@/components/steps/ReferencePanel";
import { StepFieldValidation } from "@/components/validation/StepFieldValidation";
import { useLogicFlowStore } from "@/store/logicFlowStore";

export const Step2Requirements = () => {
  const {
    setCurrentStep,
    problemStatement,
    inputs,
    outputs,
    rules,
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
  const [editingDataId, setEditingDataId] = useState<string | null>(null);
  const [editDataValue, setEditDataValue] = useState("");

  // Tools & Functions state
  const [toolInput, setToolInput] = useState("");
  const [editingToolId, setEditingToolId] = useState<string | null>(null);
  const [editToolValue, setEditToolValue] = useState("");

  // Logical Concepts state
  const [skillInput, setSkillInput] = useState("");
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
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

  const handleSaveDataEdit = (id: string) => {
    if (editDataValue.trim()) updateRequiredData(id, editDataValue.trim());
    setEditingDataId(null);
  };

  const handleSaveToolEdit = (id: string) => {
    if (editToolValue.trim()) updateToolsFunction(id, editToolValue.trim());
    setEditingToolId(null);
  };

  const handleSaveSkillEdit = (id: string) => {
    if (editSkillValue.trim()) updateLogicalConcept(id, editSkillValue.trim());
    setEditingSkillId(null);
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

        <ReferencePanel
          title="Step 1 Reference"
          items={[
            {
              label: "Problem Statement",
              values: problemStatement
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean),
              color: "indigo",
            },
            { label: "Inputs", values: inputs.map((i) => i.value), color: "indigo" },
            { label: "Outputs", values: outputs.map((i) => i.value), color: "emerald" },
            { label: "Rules", values: rules.map((i) => i.value), color: "amber" },
          ]}
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 *:min-w-0">
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
                type="button"
                onClick={handleAddData}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {requiredData.map((item, idx) =>
                editingDataId === item.id ? (
                  <div key={item.id} className="flex items-center gap-1 bg-slate-900 border border-indigo-500 rounded-lg p-1 text-xs">
                    <input
                      type="text"
                      value={editDataValue}
                      onChange={(e) => setEditDataValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveDataEdit(item.id);
                        if (e.key === "Escape") setEditingDataId(null);
                      }}
                      autoFocus
                      className="bg-transparent text-slate-100 text-xs focus:outline-none px-1 w-24"
                    />
                    <button type="button" onClick={() => handleSaveDataEdit(item.id)} className="text-emerald-400 p-0.5 cursor-pointer">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => setEditingDataId(null)} className="text-slate-400 p-0.5 cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <span key={item.id} className="inline-flex items-center gap-2 bg-indigo-950/50 border border-indigo-800/60 text-indigo-300 px-2.5 py-1 rounded-lg text-xs font-mono">
                    <span className="text-indigo-400 font-mono font-bold mr-1">
                      {idx + 1}.
                    </span>
                    {item.value}
                    <button type="button" onClick={() => { setEditingDataId(item.id); setEditDataValue(item.value); }} className="text-indigo-400 hover:text-white cursor-pointer">
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button type="button" onClick={() => removeRequiredData(item.id)} className="text-indigo-400 hover:text-rose-400 cursor-pointer">
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
                type="button"
                onClick={handleAddTool}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {toolsFunctions.map((item, idx) =>
                editingToolId === item.id ? (
                  <div key={item.id} className="flex items-center gap-1 bg-slate-900 border border-amber-500 rounded-lg p-1 text-xs">
                    <input
                      type="text"
                      value={editToolValue}
                      onChange={(e) => setEditToolValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveToolEdit(item.id);
                        if (e.key === "Escape") setEditingToolId(null);
                      }}
                      autoFocus
                      className="bg-transparent text-slate-100 text-xs focus:outline-none px-1 w-24"
                    />
                    <button type="button" onClick={() => handleSaveToolEdit(item.id)} className="text-emerald-400 p-0.5 cursor-pointer">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => setEditingToolId(null)} className="text-slate-400 p-0.5 cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <span key={item.id} className="inline-flex items-center gap-2 bg-amber-950/50 border border-amber-800/60 text-amber-300 px-2.5 py-1 rounded-lg text-xs font-mono">
                    <span className="text-indigo-400 font-mono font-bold mr-1">
                      {idx + 1}.
                    </span>
                    {item.value}
                    <button type="button" onClick={() => { setEditingToolId(item.id); setEditToolValue(item.value); }} className="text-amber-400 hover:text-white cursor-pointer">
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button type="button" onClick={() => removeToolsFunction(item.id)} className="text-amber-400 hover:text-rose-400 cursor-pointer">
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
                type="button"
                onClick={handleAddSkill}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {logicalConcepts.map((item, idx) =>
                editingSkillId === item.id ? (
                  <div key={item.id} className="flex items-center gap-1 bg-slate-900 border border-emerald-500 rounded-lg p-1 text-xs">
                    <input
                      type="text"
                      value={editSkillValue}
                      onChange={(e) => setEditSkillValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveSkillEdit(item.id);
                        if (e.key === "Escape") setEditingSkillId(null);
                      }}
                      autoFocus
                      className="bg-transparent text-slate-100 text-xs focus:outline-none px-1 w-24"
                    />
                    <button type="button" onClick={() => handleSaveSkillEdit(item.id)} className="text-emerald-400 p-0.5 cursor-pointer">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => setEditingSkillId(null)} className="text-slate-400 p-0.5 cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <span key={item.id} className="inline-flex items-center gap-2 bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 px-2.5 py-1 rounded-lg text-xs font-mono">
                    <span className="text-indigo-400 font-mono font-bold mr-1">
                      {idx + 1}.
                    </span>
                    {item.value}
                    <button type="button" onClick={() => { setEditingSkillId(item.id); setEditSkillValue(item.value); }} className="text-emerald-400 hover:text-white cursor-pointer">
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button type="button" onClick={() => removeLogicalConcept(item.id)} className="text-emerald-400 hover:text-rose-400 cursor-pointer">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                )
              )}
            </div>
          </div>
        </div>

        {/* AI sequence check + navigation */}
        <StepFieldValidation
          step={2}
          problemStatement={problemStatement}
          fields={[
            {
              key: "requiredData",
              label: "Required Data",
              value: requiredData.map((i) => i.value).join(", "),
            },
            {
              key: "toolsFunctions",
              label: "Tools & Functions",
              value: toolsFunctions.map((i) => i.value).join(", "),
            },
            {
              key: "logicalConcepts",
              label: "Logical Concepts",
              value: logicalConcepts.map((i) => i.value).join(", "),
            },
          ]}
          backLabel="Back to Step 1"
          onBack={() => setCurrentStep(1)}
          continueLabel="Next: Algorithm Design"
          onContinue={() => setCurrentStep(3)}
        />
      </div>
    </div>
  );
};

export default Step2Requirements;
