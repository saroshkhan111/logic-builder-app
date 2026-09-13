"use client";

import { ChevronDown, ClipboardList } from "lucide-react";
import { useState } from "react";

export interface ReferenceItem {
  label: string;
  values: string[];
  color: "indigo" | "amber" | "emerald" | "sky" | "violet";
}

const COLORS = {
  indigo: "bg-indigo-950/50 border-indigo-800/60 text-indigo-300",
  amber: "bg-amber-950/50 border-amber-800/60 text-amber-300",
  emerald: "bg-emerald-950/50 border-emerald-800/60 text-emerald-300",
  sky: "bg-sky-950/50 border-sky-800/60 text-sky-300",
  violet: "bg-violet-950/50 border-violet-800/60 text-violet-300",
};

export const ReferencePanel = ({ title, items }: {
  title: string;
  items: ReferenceItem[];
}) => {
  const [open, setOpen] = useState(false);
  const visible = items.filter((i) => i.values.length > 0);
  if (!visible.length) return null;
  const total = visible.reduce((s, i) => s + i.values.length, 0);

  return (
    <div className="bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-900/60 cursor-pointer"
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <ClipboardList className="w-4 h-4 text-sky-400" />
          {title}
          <span className="text-[10px] font-normal text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-full">
            {total} item{total !== 1 ? "s" : ""}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-4 pb-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 border-t border-slate-800 pt-3">
          {visible.map((item, idx) => (
            <div key={idx} className="space-y-1.5">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{item.label}</p>
              <div className="flex flex-wrap gap-1.5">
                {item.values.map((v, i) => (
                  <span key={i} className={`px-2 py-0.5 rounded-md text-[11px] font-mono border ${COLORS[item.color]}`}>{v}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};