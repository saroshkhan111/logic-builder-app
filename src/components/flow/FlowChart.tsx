"use client";

import type { FlowNode, FlowNodeType } from "@/lib/algorithmParser";

interface Props {
  nodes: FlowNode[];
}

const NODE_W = 210;
const GAP = 34;
const PADDING_X = 30;
const PADDING_Y = 20;
const SVG_W = NODE_W + PADDING_X * 2;

function getNodeHeight(type: FlowNodeType) {
  if (type === "decision") return 92;
  return 58;
}

function wrapLabel(label: string, maxChars = 24): string[] {
  const words = label.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > maxChars) {
      if (line) lines.push(line);
      line = w;
    } else {
      line = (line + " " + w).trim();
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

function TextBlock({
  lines,
  cx,
  cy,
  fill = "#e2e8f0",
  size = 12,
  weight = 500,
}: {
  lines: string[];
  cx: number;
  cy: number;
  fill?: string;
  size?: number;
  weight?: number;
}) {
  const lineHeight = size + 3;
  const startY = cy - ((lines.length - 1) * lineHeight) / 2;
  return (
    <>
      {lines.map((l, i) => (
        <text
          key={i}
          x={cx}
          y={startY + i * lineHeight}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={fill}
          fontSize={size}
          fontWeight={weight}
        >
          {l}
        </text>
      ))}
    </>
  );
}

function NodeShape({
  type,
  x,
  y,
  w,
  h,
  label,
}: {
  type: FlowNodeType;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
}) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const lines = wrapLabel(label);

  if (type === "start" || type === "end") {
    const accent = type === "start" ? "#10b981" : "#f43f5e";
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={w}
          height={h}
          rx={h / 2}
          ry={h / 2}
          fill="#0f172a"
          stroke={accent}
          strokeWidth={2}
        />
        <TextBlock lines={[label]} cx={cx} cy={cy} weight={700} />
      </g>
    );
  }

  if (type === "input" || type === "output") {
    const skew = 18;
    const accent = type === "input" ? "#38bdf8" : "#a78bfa";
    const points = `${x + skew},${y} ${x + w},${y} ${x + w - skew},${y + h} ${x},${y + h}`;
    return (
      <g>
        <polygon points={points} fill="#0f172a" stroke={accent} strokeWidth={2} />
        <TextBlock lines={lines} cx={cx} cy={cy} />
      </g>
    );
  }

  if (type === "decision") {
    const pts = `${cx},${y} ${x + w},${cy} ${cx},${y + h} ${x},${cy}`;
    return (
      <g>
        <polygon points={pts} fill="#1e1b4b" stroke="#f59e0b" strokeWidth={2} />
        <TextBlock lines={lines} cx={cx} cy={cy} size={11} weight={600} />
      </g>
    );
  }

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={8}
        ry={8}
        fill="#0f172a"
        stroke="#6366f1"
        strokeWidth={1.5}
      />
      <TextBlock lines={lines} cx={cx} cy={cy} />
    </g>
  );
}

type PositionedNode = FlowNode & {
  x: number;
  y: number;
  w: number;
  h: number;
};

function layoutNodes(nodes: FlowNode[]): { positioned: PositionedNode[]; totalH: number } {
  const positioned: PositionedNode[] = [];
  let cursorY = PADDING_Y;
  for (const n of nodes) {
    const h = getNodeHeight(n.type);
    positioned.push({ ...n, x: PADDING_X, y: cursorY, w: NODE_W, h });
    cursorY += h + GAP;
  }
  return { positioned, totalH: cursorY + PADDING_Y - GAP };
}

export default function FlowChart({ nodes }: Props) {
  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-72 text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl p-6 text-center">
        Once you start writing your algorithm,
        <br />
        a proper flowchart with the correct symbols will appear here automatically. 🎨
      </div>
    );
  }

  const { positioned, totalH } = layoutNodes(nodes);

  return (
    <div className="overflow-auto max-h-[560px] bg-slate-950 border border-slate-800 rounded-xl p-2">
      <svg width={SVG_W} height={totalH} className="mx-auto block">
        <defs>
          <marker
            id="arrow"
            markerWidth="10"
            markerHeight="10"
            refX="8"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="#475569" />
          </marker>
        </defs>

        {positioned.slice(0, -1).map((n, i) => {
          const next = positioned[i + 1];
          const x1 = n.x + n.w / 2;
          const y1 = n.y + n.h;
          const x2 = next.x + next.w / 2;
          const y2 = next.y;
          const midY = (y1 + y2) / 2;
          return (
            <path
              key={`edge-${n.id}`}
              d={`M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`}
              fill="none"
              stroke="#475569"
              strokeWidth={1.5}
              markerEnd="url(#arrow)"
            />
          );
        })}

        {positioned.map((n) => (
          <NodeShape
            key={n.id}
            type={n.type}
            x={n.x}
            y={n.y}
            w={n.w}
            h={n.h}
            label={n.label}
          />
        ))}
      </svg>
    </div>
  );
}