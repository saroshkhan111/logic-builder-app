export type FlowNodeType =
  | "start"
  | "end"
  | "input"
  | "output"
  | "process"
  | "decision";

export interface FlowNode {
  id: string;
  type: FlowNodeType;
  label: string;
  raw: string;
  lineNumber: number;
}

export function parseAlgorithm(text: string): FlowNode[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const nodes: FlowNode[] = [];
  let counter = 0;

  lines.forEach((raw, i) => {
    const line = raw.replace(/^[0-9]+[.)]\s*/, "").trim();
    if (!line) return;
    const lower = line.toLowerCase();
    const id = `node-${counter++}-${i}`;

    let type: FlowNodeType = "process";
    let label = line;

    if (/^(start|begin)$/.test(lower)) {
      type = "start";
      label = "START";
    } else if (/^(end|stop|finish)$/.test(lower)) {
      type = "end";
      label = "END";
    } else if (/^(input|read|get|accept|take)\b/.test(lower)) {
      type = "input";
      const cleaned = line.replace(/^(input|read|get|accept|take)\s*/i, "");
      label = `INPUT: ${cleaned || line}`;
    } else if (/^(output|print|display|show|write)\b/.test(lower)) {
      type = "output";
      const cleaned = line.replace(/^(output|print|display|show|write)\s*/i, "");
      label = `OUTPUT: ${cleaned || line}`;
    } else if (/^(if|else if|while|for)\b/.test(lower)) {
      type = "decision";
      const cleaned = line.replace(/^(if|else if|else|while|for)\s*/i, "");
      label = cleaned.toUpperCase().startsWith("IF")
        ? cleaned
        : `IF ${cleaned}`;
    } else if (/^else$/.test(lower)) {
      type = "process";
      label = "ELSE branch";
    }

    nodes.push({ id, type, label, raw, lineNumber: i + 1 });
  });

  return nodes;
}

export function toPseudocode(text: string): string {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const out: string[] = [];
  lines.forEach((raw, i) => {
    const line = raw.replace(/^[0-9]+[.)]\s*/, "").trim();
    out.push(`${i + 1}. ${line.toUpperCase()}`);
  });
  return out.join("\n");
}