"use client";

import { AlertCircle, Check, CheckCircle2, Edit2, FileCode, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";

import { useLogicFlowStore } from "@/store/logicFlowStore";

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
  } = useLogicFlowStore();

  const [noteInput, setNoteInput] = useState("");
  const [editingNoteIdx, setEditingNoteIdx] = useState<number | null>(null);
  const [editNoteValue, setEditNoteValue] = useState("");

  // PEP 8 Validation Check
  const isSnakeCase = /^[a-z0-9_]+\.py$/.test(fileName);

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
        </div>

        {/* Python Code Editor */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
          <label className="block text-xs font-semibold text-slate-300">Python Code Workspace</label>
          <textarea
            value={pythonCode}
            onChange={(e) => setPythonCode(e.target.value)}
            placeholder="# Write Python code here..."
            className="w-full h-48 bg-slate-900 border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed resize-y"
          />
        </div>

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
