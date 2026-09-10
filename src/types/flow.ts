import type { Node, Edge } from "reactflow";

/** A step in the 6-step logic-building methodology. */
export type StepId = 1 | 2 | 3 | 4 | 5 | 6;

export interface LogicNodeData {
  label: string;
  description?: string;
  stepId?: StepId;
  code?: string;
}

export type LogicNode = Node<LogicNodeData>;
export type LogicEdge = Edge;

export interface ValidationIssue {
  nodeId?: string | null;
  message: string;
  severity: "error" | "warning" | "info";
}

export interface FlowValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  errorCount: number;
  warningCount: number;
}

export interface PEP8Issue {
  line: number;
  column: number;
  code: string;
  message: string;
}

export interface PEP8Result {
  issues: PEP8Issue[];
  issueCount: number;
}

/** Result of executing Python code via Pyodide. */
export interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  durationMs: number;
}
