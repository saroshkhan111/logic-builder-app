"use client";

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  ListChecks,
  Loader2,
  Lock,
  XCircle,
} from "lucide-react";
import { useCallback, useState } from "react";

import { hasCorrection } from "@/lib/aiChatResponse";
import type { FieldValidationResult } from "@/lib/fieldValidation";
import {
  useFieldValidation,
  type FieldValidationStatus,
} from "@/lib/useFieldValidation";

/**
 * Sequence-based field validation footer.
 *
 * The step owns its fields (in order) and this component:
 * - validates them ONE AT A TIME: field N is only sent to the AI once field N-1
 *   is accepted, so feedback always arrives in filling order
 * - shows ✅ Sahi / ❌ Galat + reason + correction per field
 * - re-validates as soon as the learner edits a value
 * - only lets the learner continue once no field is empty or marked wrong
 *   (if the AI check itself fails, the learner is NOT blocked — the app cannot
 *   verify a value it never received a verdict for)
 */

export interface ValidationField {
  /** Stable id for the field, e.g. "problemStatement". */
  key: string;
  /** Label shown in the checklist, e.g. "Required Data". */
  label: string;
  /** Current value coming from the store (arrays are joined by the step). */
  value: string;
}

interface Props {
  /** Step of the 6-step flow, used as AI context. */
  step: number;
  fields: ValidationField[];
  problemStatement?: string;
  continueLabel: string;
  onContinue: () => void;
  backLabel?: string;
  onBack?: () => void;
  /** Debounce for the AI check (tests use 0 to keep them fast). */
  debounceMs?: number;
}

type VerdictOutcome = "correct" | "incorrect" | "unavailable";

interface StoredVerdict {
  /** Value the verdict belongs to; editing the value invalidates it. */
  value: string;
  outcome: VerdictOutcome;
  result: FieldValidationResult | null;
}

const EMPTY_VERDICTS: Record<string, StoredVerdict> = {};

function verdictFor(
  verdicts: Record<string, StoredVerdict>,
  field: ValidationField
): StoredVerdict | null {
  const stored = verdicts[field.key];
  if (!stored || stored.value !== field.value.trim()) return null;
  return stored;
}

/** Correct values and "AI check failed" values both let the flow continue. */
function isAccepted(verdict: StoredVerdict | null): boolean {
  return verdict?.outcome === "correct" || verdict?.outcome === "unavailable";
}

/** Maps a finalized hook status to the verdict stored for the field. */
function verdictFromStatus(
  status: FieldValidationStatus,
  result: FieldValidationResult | null,
  value: string
): StoredVerdict | null {
  if (status === "valid") return { value, outcome: "correct", result };
  if (status === "invalid") return { value, outcome: "incorrect", result };
  if (status === "unavailable") {
    return { value, outcome: "unavailable", result: null };
  }
  return null;
}

type RowStatus =
  | "checking"
  | "correct"
  | "incorrect"
  | "unavailable"
  | "empty"
  | "waiting";

const STATUS_CONFIG = {
  checking: {
    icon: Loader2,
    label: "Check ho raha hai...",
    color: "text-indigo-400",
    box: "border-slate-700 bg-slate-900/60",
    spin: true,
  },
  correct: {
    icon: CheckCircle2,
    label: "Sahi",
    color: "text-emerald-400",
    box: "border-emerald-500/30 bg-emerald-500/10",
    spin: false,
  },
  incorrect: {
    icon: XCircle,
    label: "Galat",
    color: "text-rose-400",
    box: "border-rose-500/30 bg-rose-500/10",
    spin: false,
  },
  unavailable: {
    icon: AlertTriangle,
    label: "AI check nahi chala",
    color: "text-amber-400",
    box: "border-amber-500/30 bg-amber-500/10",
    spin: false,
  },
  empty: {
    icon: AlertTriangle,
    label: "Khaali field",
    color: "text-amber-400",
    box: "border-amber-500/30 bg-amber-500/10",
    spin: false,
  },
  waiting: {
    icon: Lock,
    label: "Ruko",
    color: "text-slate-500",
    box: "border-slate-800 bg-slate-900/40",
    spin: false,
  },
} as const;
export function StepFieldValidation({
  step,
  fields,
  problemStatement,
  continueLabel,
  onContinue,
  backLabel,
  onBack,
  debounceMs,
}: Props) {
  const [verdicts, setVerdicts] =
    useState<Record<string, StoredVerdict>>(EMPTY_VERDICTS);

  const storeVerdict = useCallback((key: string, verdict: StoredVerdict) => {
    setVerdicts((prev) => {
      const existing = prev[key];
      // Same verdict for the same value → keep the old object so React can bail
      // out instead of re-rendering (and re-validating) forever.
      if (
        existing &&
        existing.value === verdict.value &&
        existing.outcome === verdict.outcome
      ) {
        return prev;
      }
      return { ...prev, [key]: verdict };
    });
  }, []);

  // Sequence gate: the first field without an accepted verdict is the active
  // one, so later fields are never checked before the earlier ones are right.
  const activeIndex = fields.findIndex(
    (field) => !isAccepted(verdictFor(verdicts, field))
  );
  const activeField = activeIndex === -1 ? null : fields[activeIndex];
  const activeKey = activeField?.key ?? "";
  const activeValue = activeField?.value.trim() ?? "";
  const existingData =
    activeIndex > 0
      ? fields
          .slice(0, activeIndex)
          .map((field) => `${field.label}: ${field.value.trim()}`)
          .join("; ")
      : "";

  const { status, result, message, validatedValue } = useFieldValidation({
    step,
    fieldName: activeField?.label ?? "",
    value: activeField?.value ?? "",
    problemStatement,
    existingData,
    enabled: Boolean(activeField) && activeValue.length > 0,
    debounceMs,
  });
  // Persist the active field's verdict as soon as the AI finalizes it for the
  // value the learner has right now. The store runs during render, guarded by
  // a comparison against the stored verdict (the React "adjust state when
  // props change" pattern), so it fires exactly once per new verdict instead
  // of cascading a synchronous setState through an effect.
  const storedVerdict = activeKey ? verdicts[activeKey] : undefined;
  const verdictToStore =
    validatedValue && validatedValue === activeValue
      ? verdictFromStatus(status, result, validatedValue)
      : null;
  if (
    verdictToStore &&
    (storedVerdict?.value !== verdictToStore.value ||
      storedVerdict?.outcome !== verdictToStore.outcome)
  ) {
    storeVerdict(activeKey, verdictToStore);
  }

  // A field blocks the flow while it is empty (not filled yet) or while the AI
  // says it is wrong. Pending/unavailable values never block, so a learner is
  // not stuck when the AI check itself cannot run.
  const blockingField = fields.find((field) => {
    if (!field.value.trim()) return true;
    return verdictFor(verdicts, field)?.outcome === "incorrect";
  });
  const isBlocked = Boolean(blockingField);

  const rows = fields.map((field, index) => {
    const stored = verdictFor(verdicts, field);
    const isActive = index === activeIndex;
    const row: {
      field: ValidationField;
      status: RowStatus;
      detail: string;
      correction: string;
      hint: string;
    } = {
      field,
      status: "waiting",
      detail: "",
      correction: "",
      hint: "",
    };

    if (isActive) {
      if (!field.value.trim()) {
        row.status = "empty";
        row.detail = "Yeh field khaali hai - pehle ise bharo.";
      } else if (status === "invalid") {
        row.status = "incorrect";
        row.detail = result?.reason ?? "";
        row.correction = result?.correction ?? "";
      } else if (status === "unavailable") {
        row.status = "unavailable";
        row.detail = message;
      } else if (status === "valid" || stored?.outcome === "correct") {
        row.status = "correct";
        row.detail = result?.reason ?? stored?.result?.reason ?? "";
        row.hint = result?.nextHint ?? stored?.result?.nextHint ?? "";
      } else {
        row.status = "checking";
        row.detail = "AI tumhari value check kar raha hai...";
      }

      return row;
    }

    if (stored?.outcome === "correct") {
      row.status = "correct";
      row.detail = stored.result?.reason ?? "";
    } else if (stored?.outcome === "incorrect") {
      row.status = "incorrect";
      row.detail = stored.result?.reason ?? "";
      row.correction = stored.result?.correction ?? "";
    } else if (stored?.outcome === "unavailable") {
      row.status = "unavailable";
      row.detail = "AI check nahi chala - aap aage badh sakte ho.";
    } else if (!field.value.trim()) {
      row.status = "empty";
      row.detail = "Khaali - pehle upar wale fields sahi karo.";
    } else {
      row.detail = "Pehle upar wale fields sahi karo, phir yeh check hoga.";
    }

    return row;
  });
const activeHint = rows[activeIndex]?.hint ?? "";
  const hasNextField = activeIndex !== -1 && activeIndex < fields.length - 1;
  const headerBadge = isBlocked
    ? `Field ${Math.min(activeIndex + 1, fields.length)}/${fields.length}`
    : "Sab sahi";

  return (
    <div className="space-y-3">
      {/* AI check panel */}
      <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs">
            <ListChecks className="w-4 h-4" />
            AI Field Check
            <span className="text-[9px] bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded-full">
              AI
            </span>
          </div>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full border ${
              isBlocked
                ? "text-amber-300 bg-amber-500/10 border-amber-500/20"
                : "text-emerald-300 bg-emerald-500/10 border-emerald-500/20"
            }`}
          >
            {headerBadge}
          </span>
        </div>

        <ul className="space-y-2">
          {rows.map((row, index) => {
            const config = STATUS_CONFIG[row.status];
            const Icon = config.icon;

            return (
              <li
                key={row.field.key}
                className={`rounded-lg border p-2.5 ${config.box}`}
              >
                <div className="flex items-start gap-2">
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${config.color} ${
                      config.spin ? "animate-spin" : ""
                    }`}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                        {index + 1}. {row.field.label}
                      </span>
                      <span className={`text-[10px] font-semibold ${config.color}`}>
                        {row.status === "correct" ? "✅ Sahi" : config.label}
                      </span>
                    </div>

                    {row.detail && (
                      <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                        {row.detail}
                      </p>
                    )}

                    {row.status === "incorrect" &&
                      hasCorrection(row.correction) && (
                        <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2">
                          <span className="block text-[10px] font-bold text-amber-400">
                            Correction
                          </span>
                          <p className="text-xs whitespace-pre-wrap text-amber-100">
                            {row.correction}
                          </p>
                        </div>
                      )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {activeHint && hasNextField && (
          <div className="flex items-start gap-2 rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-2">
            <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5 text-indigo-300" />
            <p className="text-xs text-indigo-100">Agla focus: {activeHint}</p>
          </div>
        )}

        {isBlocked && (
          <p className="text-[11px] text-amber-300">
            Har field sahi (✅) hone par hi aap agle step par ja sakte ho.
          </p>
        )}
      </div>

      {/* Navigation */}
      <div
        className={`flex ${onBack ? "justify-between" : "justify-end"} pt-2`}
      >
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all cursor-pointer"
          >
            {backLabel ?? "Back"}
          </button>
        )}
        <button
          onClick={onContinue}
          disabled={isBlocked}
          aria-label={continueLabel}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none"
        >
          {continueLabel} <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}