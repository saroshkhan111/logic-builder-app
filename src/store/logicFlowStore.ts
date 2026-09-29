"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { LogicEdge, LogicNode, OptimizationSuggestion, ComplexityMetrics, BenchmarkResult } from "@/types/flow";

/** Default editor contents before the user writes real code. */
export const DEFAULT_PYTHON_CODE = "# Write your Python code here\n";

/** True when the editor still has only the placeholder stub. */
export const isDefaultPythonCode = (code: string | null | undefined): boolean =>
  !code || code === DEFAULT_PYTHON_CODE;

export type TestSource = "auto-generated" | "template" | "manual" | "invalid";

export interface TestCase {
  id: string;
  name: string;
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  status?: "PASSED" | "FAILED" | "PENDING" | "RUNNING";
  source?: TestSource;
}

/** A CRUD list item with a stable unique id (survives reorder/delete). */
export interface IdValueItem {
  id: string;
  value: string;
}

/** Store fields persisted as `IdValueItem[]` (used by the persist migration). */
const ID_LIST_FIELDS = [
  "inputs",
  "outputs",
  "rules",
  "requiredData",
  "toolsFunctions",
  "logicalConcepts",
  "codeNotes",
  "optimizationRules",
] as const;

/**
 * Unique id for list items. Uses crypto.randomUUID when available and a
 * timestamp+random fallback for non-secure contexts / older test runners.
 */
const createListItemId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

interface LogicFlowState {
  // Navigation
  currentStep: number;
  setCurrentStep: (step: number) => void;
  aiGuideEnabled: boolean;
  setAIGuideEnabled: (enabled: boolean) => void;

  // Step 1 - Problem Statement
  problemStatement: string;
  setProblemStatement: (statement: string) => void;
  inputs: IdValueItem[];
  addInputItem: (item: string) => void;
  updateInputItem: (id: string, value: string) => void;
  removeInputItem: (id: string) => void;
  outputs: IdValueItem[];
  addOutputItem: (output: string) => void;
  updateOutputItem: (id: string, value: string) => void;
  removeOutputItem: (id: string) => void;
  rules: IdValueItem[];
  addRule: (item: string) => void;
  updateRule: (id: string, value: string) => void;
  removeRule: (id: string) => void;

  // Step 2 - Requirements
  requiredData: IdValueItem[];
  addRequiredData: (item: string) => void;
  updateRequiredData: (id: string, value: string) => void;
  removeRequiredData: (id: string) => void;
  toolsFunctions: IdValueItem[];
  addToolsFunction: (item: string) => void;
  updateToolsFunction: (id: string, value: string) => void;
  removeToolsFunction: (id: string) => void;
  logicalConcepts: IdValueItem[];
  addLogicalConcept: (item: string) => void;
  updateLogicalConcept: (id: string, value: string) => void;
  removeLogicalConcept: (id: string) => void;

  // Step 3 - Algorithm
  algorithm: string;
  setAlgorithm: (code: string) => void;
  pseudocodeSteps: string[];
  setPseudocodeSteps: (steps: string[]) => void;
  addPseudocodeStep: (item: string) => void;
  updatePseudocodeStep: (index: number, value: string) => void;
  removePseudocodeStep: (index: number) => void;

  // Step 4 - Code
  fileName: string;
  setFileName: (name: string) => void;
  pythonCode: string;
  setPythonCode: (code: string) => void;
  codeNotes: IdValueItem[];
  addCodeNote: (item: string) => void;
  updateCodeNote: (id: string, value: string) => void;
  removeCodeNote: (id: string) => void;

  // Step 5 - Testing
  testCases: TestCase[];
  addTestCase: (testCase: TestCase) => void;
  updateTestCase: (id: string, updates: Partial<TestCase>) => void;
  removeTestCase: (id: string) => void;
  updateTestCaseResult: (
    id: string,
    status: TestCase["status"],
    actualOutput?: string
  ) => void;
  isTesting: boolean;
  setIsTesting: (isTesting: boolean) => void;

  // Step 6 - Optimization
  optimizationRules: IdValueItem[];
  addOptimizationRule: (item: string) => void;
  updateOptimizationRule: (id: string, value: string) => void;
  removeOptimizationRule: (id: string) => void;
  optimizationSuggestions: OptimizationSuggestion[];
  setOptimizationSuggestions: (suggestions: OptimizationSuggestion[]) => void;
  applySuggestion: (id: string) => void;
  complexityMetrics: ComplexityMetrics | null;
  setComplexityMetrics: (metrics: ComplexityMetrics | null) => void;
  benchmarkResult: BenchmarkResult | null;
  setBenchmarkResult: (result: BenchmarkResult | null) => void;

  // Flow chart
  nodes: LogicNode[];
  edges: LogicEdge[];
  activeNodeId: string | null;
  setNodes: (nodes: LogicNode[]) => void;
  setEdges: (edges: LogicEdge[]) => void;
  onNodesChange: (changes: Partial<LogicNode>[]) => void;
  addNode: (node: LogicNode) => void;
  addEdge: (edge: LogicEdge) => void;
  setActiveNode: (id: string | null) => void;

  reset: () => void;
}

export const useLogicFlowStore = create<LogicFlowState>()(
  persist(
    (set) => ({
  // Navigation
  currentStep: 1,
  setCurrentStep: (step) => set({ currentStep: step }),
  aiGuideEnabled: false,
  setAIGuideEnabled: (enabled) => set({ aiGuideEnabled: enabled }),

  // Step 1 - Problem Statement
  problemStatement: "",
  setProblemStatement: (statement) => set({ problemStatement: statement }),
  inputs: [],
  addInputItem: (item) =>
    set((state) => ({
      inputs: [...state.inputs, { id: createListItemId(), value: item }],
    })),
  updateInputItem: (id, value) =>
    set((state) => ({
      inputs: state.inputs.map((item) =>
        item.id === id ? { ...item, value } : item
      ),
    })),
  removeInputItem: (id) =>
    set((state) => ({
      inputs: state.inputs.filter((item) => item.id !== id),
    })),
  outputs: [],
  addOutputItem: (output) =>
    set((state) => ({
      outputs: [...state.outputs, { id: createListItemId(), value: output }],
    })),
  updateOutputItem: (id, value) =>
    set((state) => ({
      outputs: state.outputs.map((item) =>
        item.id === id ? { ...item, value } : item
      ),
    })),
  removeOutputItem: (id) =>
    set((state) => ({
      outputs: state.outputs.filter((item) => item.id !== id),
    })),
  rules: [],
  addRule: (item) =>
    set((state) => ({
      rules: [...state.rules, { id: createListItemId(), value: item }],
    })),
  updateRule: (id, value) =>
    set((state) => ({
      rules: state.rules.map((item) =>
        item.id === id ? { ...item, value } : item
      ),
    })),
  removeRule: (id) =>
    set((state) => ({
      rules: state.rules.filter((item) => item.id !== id),
    })),

  // Step 2 - Requirements
  requiredData: [],
  addRequiredData: (item) =>
    set((state) => ({
      requiredData: [...state.requiredData, { id: createListItemId(), value: item }],
    })),
  updateRequiredData: (id, value) =>
    set((state) => ({
      requiredData: state.requiredData.map((item) =>
        item.id === id ? { ...item, value } : item
      ),
    })),
  removeRequiredData: (id) =>
    set((state) => ({
      requiredData: state.requiredData.filter((item) => item.id !== id),
    })),
  toolsFunctions: [],
  addToolsFunction: (item) =>
    set((state) => ({
      toolsFunctions: [...state.toolsFunctions, { id: createListItemId(), value: item }],
    })),
  updateToolsFunction: (id, value) =>
    set((state) => ({
      toolsFunctions: state.toolsFunctions.map((item) =>
        item.id === id ? { ...item, value } : item
      ),
    })),
  removeToolsFunction: (id) =>
    set((state) => ({
      toolsFunctions: state.toolsFunctions.filter((item) => item.id !== id),
    })),
  logicalConcepts: [],
  addLogicalConcept: (item) =>
    set((state) => ({
      logicalConcepts: [...state.logicalConcepts, { id: createListItemId(), value: item }],
    })),
  updateLogicalConcept: (id, value) =>
    set((state) => ({
      logicalConcepts: state.logicalConcepts.map((item) =>
        item.id === id ? { ...item, value } : item
      ),
    })),
  removeLogicalConcept: (id) =>
    set((state) => ({
      logicalConcepts: state.logicalConcepts.filter((item) => item.id !== id),
    })),

  // Step 3 - Algorithm
  algorithm: "",
  setAlgorithm: (code) => set({ algorithm: code }),
  pseudocodeSteps: [],
  setPseudocodeSteps: (steps) => set({ pseudocodeSteps: steps }),
  addPseudocodeStep: (item) =>
    set((state) => ({ pseudocodeSteps: [...state.pseudocodeSteps, item] })),
  updatePseudocodeStep: (index, value) =>
    set((state) => ({
      pseudocodeSteps: state.pseudocodeSteps.map((item, i) =>
        i === index ? value : item
      ),
    })),
  removePseudocodeStep: (index) =>
    set((state) => ({
      pseudocodeSteps: state.pseudocodeSteps.filter((_, i) => i !== index),
    })),

  // Step 4 - Code
  fileName: "my_logic.py",
  setFileName: (name) => set({ fileName: name }),
  pythonCode: DEFAULT_PYTHON_CODE,
  setPythonCode: (code) => set({ pythonCode: code }),
  codeNotes: [],
  addCodeNote: (item) =>
    set((state) => ({
      codeNotes: [...state.codeNotes, { id: createListItemId(), value: item }],
    })),
  updateCodeNote: (id, value) =>
    set((state) => ({
      codeNotes: state.codeNotes.map((item) =>
        item.id === id ? { ...item, value } : item
      ),
    })),
  removeCodeNote: (id) =>
    set((state) => ({
      codeNotes: state.codeNotes.filter((item) => item.id !== id),
    })),

  // Step 5 - Testing
  testCases: [],
  isTesting: false,
  addTestCase: (testCase) =>
    set((state) => ({ testCases: [...state.testCases, testCase] })),
  updateTestCase: (id, updates) =>
    set((state) => ({
      testCases: state.testCases.map((tc) =>
        tc.id === id ? { ...tc, ...updates } : tc
      ),
    })),
  removeTestCase: (id) =>
    set((state) => ({
      testCases: state.testCases.filter((tc) => tc.id !== id),
    })),
  updateTestCaseResult: (id, status, actualOutput) =>
    set((state) => ({
      testCases: state.testCases.map((tc) =>
        tc.id === id ? { ...tc, status, actualOutput } : tc
      ),
    })),
  setIsTesting: (isTesting) => set({ isTesting }),

  // Step 6 - Optimization
  optimizationRules: [],
  addOptimizationRule: (item) =>
    set((state) => ({
      optimizationRules: [
        ...state.optimizationRules,
        { id: createListItemId(), value: item },
      ],
    })),
  updateOptimizationRule: (id, value) =>
    set((state) => ({
      optimizationRules: state.optimizationRules.map((item) =>
        item.id === id ? { ...item, value } : item
      ),
    })),
  removeOptimizationRule: (id) =>
    set((state) => ({
      optimizationRules: state.optimizationRules.filter(
        (item) => item.id !== id
      ),
    })),
  optimizationSuggestions: [],
  setOptimizationSuggestions: (suggestions) => set({ optimizationSuggestions: suggestions }),
  applySuggestion: (id) =>
    set((state) => ({
      optimizationSuggestions: state.optimizationSuggestions.map((s) =>
        s.id === id ? { ...s, applied: true } : s
      ),
    })),
  complexityMetrics: null,
  setComplexityMetrics: (metrics) => set({ complexityMetrics: metrics }),
  benchmarkResult: null,
  setBenchmarkResult: (result) => set({ benchmarkResult: result }),

  // Flow chart
  nodes: [],
  edges: [],
  activeNodeId: null,
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  onNodesChange: (changes) =>
    set((state) => {
      const byId = new Map(changes.map((c) => [c.id, c]));
      return {
        nodes: state.nodes.map((node) => {
          const change = byId.get(node.id);
          return change ? { ...node, ...change } : node;
        }),
      };
    }),
  addNode: (node) =>
    set((state) =>
      state.nodes.some((n) => n.id === node.id)
        ? state
        : { nodes: [...state.nodes, node] }
    ),
  addEdge: (edge) =>
    set((state) =>
      state.edges.some((e) => e.id === edge.id)
        ? state
        : { edges: [...state.edges, edge] }
    ),
  setActiveNode: (id) => set({ activeNodeId: id }),

  reset: () =>
    set({
      currentStep: 1,
      problemStatement: "",
      inputs: [],
      outputs: [],
      rules: [],
      requiredData: [],
      toolsFunctions: [],
      logicalConcepts: [],
      algorithm: "",
      pseudocodeSteps: [],
      fileName: "my_logic.py",
      pythonCode: DEFAULT_PYTHON_CODE,
      codeNotes: [],
      testCases: [],
      isTesting: false,
      optimizationRules: [],
      optimizationSuggestions: [],
      complexityMetrics: null,
      benchmarkResult: null,
      nodes: [],
      edges: [],
      activeNodeId: null,
      aiGuideEnabled: false,
    }),
    }),
    {
      name: 'logic-builder-storage',
      version: 1,
      // v1: CRUD list fields changed from string[] to { id, value }[] —
      // upgrade previously saved plain-string lists so old saves keep working.
      migrate: (persistedState, version) => {
        const state = persistedState as Record<string, unknown> | undefined;
        if (version === 0 && state) {
          for (const field of ID_LIST_FIELDS) {
            const list = state[field];
            if (Array.isArray(list)) {
              state[field] = (list as Array<string | IdValueItem>).map((item) =>
                typeof item === "string"
                  ? { id: createListItemId(), value: item }
                  : item
              );
            }
          }
        }
        return state as unknown as LogicFlowState;
      },
    },
  ),
);

export type { LogicFlowState };
