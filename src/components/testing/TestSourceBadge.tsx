import type { TestSource } from "@/store/logicFlowStore";

interface TestSourceBadgeProps {
  source?: TestSource;
}

const badgeConfig: Record<
  TestSource,
  { label: string; icon: string; className: string }
> = {
  "auto-generated": {
    label: "Auto",
    icon: "🟢",
    className: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  },
  template: {
    label: "Template",
    icon: "🔵",
    className: "bg-blue-500/10 border-blue-500/20 text-blue-400",
  },
  manual: {
    label: "Manual",
    icon: "🟡",
    className: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  },
  invalid: {
    label: "Invalid",
    icon: "🔴",
    className: "bg-rose-500/10 border-rose-500/20 text-rose-400",
  },
};

export const TestSourceBadge = ({ source }: TestSourceBadgeProps) => {
  if (!source) return null;

  const config = badgeConfig[source];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${config.className}`}
    >
      <span className="text-[8px]">{config.icon}</span>
      {config.label}
    </span>
  );
};

export default TestSourceBadge;
