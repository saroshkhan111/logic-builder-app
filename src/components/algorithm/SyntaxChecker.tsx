"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, Loader2, Wrench } from "lucide-react";

import type { SyntaxIssue } from "@/lib/algorithmSyntaxChecker";

interface Props {
  issues: SyntaxIssue[];
  onFix: (issue: SyntaxIssue) => void;
  isLoading?: boolean;
  overallFeedback?: string;
  aiAnalyzed?: boolean;
  complexity?: 'simple' | 'medium' | 'complex';
}

const SEVERITY_CONFIG = {
  error: {
    icon: AlertCircle,
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    label: "Error",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    label: "Warning",
  },
  info: {
    icon: Info,
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
    label: "Info",
  },
} as const;

export function SyntaxChecker({ issues, onFix, isLoading, overallFeedback, aiAnalyzed, complexity }: Props) {
  const errorCount = issues.filter(i => i.severity === "error").length;
  const warningCount = issues.filter(i => i.severity === "warning").length;
  const infoCount = issues.filter(i => i.severity === "info").length;

  return (
    <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs">
          <Wrench className="w-4 h-4" />
          Syntax Check
          {aiAnalyzed && (
            <span className="text-[9px] bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded-full">
              AI
            </span>
          )}
        </div>

        {isLoading ? (
          <span className="flex items-center gap-1.5 text-xs text-indigo-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Analyzing...
          </span>
        ) : issues.length === 0 ? (
          <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            All Good
          </span>
        ) : (
          <div className="flex items-center gap-2 text-[10px]">
            {errorCount > 0 && (
              <span className="text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
                {errorCount} error{errorCount !== 1 ? "s" : ""}
              </span>
            )}
            {warningCount > 0 && (
              <span className="text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                {warningCount} warning{warningCount !== 1 ? "s" : ""}
              </span>
            )}
            {infoCount > 0 && (
              <span className="text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full">
                {infoCount} info
              </span>
            )}
          </div>
        )}
      </div>

      {/* AI Feedback */}
      {!isLoading && overallFeedback && (
        <div className="text-xs text-slate-300 bg-slate-900/60 border border-slate-800 rounded-lg p-2.5">
          💬 {overallFeedback}
        </div>
      )}

      {/* Complexity Badge */}
      {!isLoading && complexity && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500">Complexity:</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
            complexity === 'simple' ? 'bg-emerald-500/20 text-emerald-300' :
            complexity === 'medium' ? 'bg-amber-500/20 text-amber-300' :
            'bg-rose-500/20 text-rose-300'
          }`}>
            {complexity.charAt(0).toUpperCase() + complexity.slice(1)}
          </span>
        </div>
      )}

      {/* Issues List */}
      {issues.length === 0 ? (
        <div className="text-xs text-slate-400 py-2">
          ✅ No syntax issues found. Your algorithm looks good!
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          <AnimatePresence mode="popLayout">
            {issues.map((issue, index) => {
              const config = SEVERITY_CONFIG[issue.severity];
              const Icon = config.icon;

              return (
                <motion.div
                  key={`${issue.lineNumber}-${issue.type}-${index}`}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className={`${config.bg} ${config.border} border rounded-lg p-2.5`}
                >
                  <div className="flex items-start gap-2">
                    <Icon className={`w-3.5 h-3.5 ${config.color} mt-0.5 shrink-0`} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${config.color}`}>
                          {config.label}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Line {issue.lineNumber}
                        </span>
                      </div>

                      <p className="text-xs text-slate-200 mt-1">
                        {issue.message}
                      </p>

                      <p className="text-[10px] text-slate-400 mt-1 italic">
                        💡 {issue.suggestion}
                      </p>

                      {issue.fix && (
                        <button
                          onClick={() => onFix(issue)}
                          className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 
                                     bg-emerald-600 hover:bg-emerald-500 
                                     text-white text-[10px] font-semibold 
                                     rounded transition-colors cursor-pointer"
                        >
                          <Wrench className="w-3 h-3" />
                          Fix Now
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export default SyntaxChecker;
