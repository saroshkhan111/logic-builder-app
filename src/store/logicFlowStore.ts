"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { LogicEdge, LogicNode } from "@/types/flow";

export interface TestCase {
  id: string;
  name: string;
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  status?: "PASSED" | "FAILED" | "PENDING" | "RUNNING";
}

interface LogicFlowState {
  // Navigation
  currentStep: number;
  setCurrentStep: (step: number) => void;

  // Step 1 - Problem Statement
  problemStatement: string;
  setProblemStatement: (statement: string) => void;
  inputs: string[];
  addInputItem: (input: string) => void;
  updateInputItem: (index: number, value: string) => void;
  removeInputItem: (index: number) => void;
  outputs: string[];
  addOutputItem: (output: string) => void;
  updateOutputItem: (index: number, value: string) => void;
  removeOutputItem: (index: number) => void;
  rules: string[];
  addRule: (item: string) => void;
  updateRule: (index: number, value: string) => void;
  removeRule: (index: number) => void;

  // Step 2 - Requirements
  requiredData: string[];
  addRequiredData: (item: string) => void;
  updateRequiredData: (index: number, value: string) => void;
  removeRequiredData: (index: number) => void;
  toolsFunctions: string[];
  addToolsFunction: (item: string) => void;
  updateToolsFunction: (index: number, value: string) => void;
  removeToolsFunction: (index: number) => void;
  logicalConcepts: string[];
  addLogicalConcept: (item: string) => void;
  updateLogicalConcept: (index: number, value: string) => void;
  removeLogicalConcept: (index: number) => void;

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
  codeNotes: string[];
  addCodeNote: (item: string) => void;
  updateCodeNote: (index: number, value: string) => void;
  removeCodeNote: (index: number) => void;

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
  optimizationRules: string[];
  addOptimizationRule: (item: string) => void;
  updateOptimizationRule: (index: number, value: string) => void;
  removeOptimizationRule: (index: number) => void;

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

  // Step 1 - Problem Statement
  problemStatement: "",
  setProblemStatement: (statement) => set({ problemStatement: statement }),
  inputs: [],
  addInputItem: (input) =>
    set((state) => ({ inputs: [...state.inputs, input] })),
  updateInputItem: (index, value) =>
    set((state) => ({
      inputs: state.inputs.map((item, i) => (i === index ? value : item)),
    })),
  removeInputItem: (index) =>
    set((state) => ({
      inputs: state.inputs.filter((_, i) => i !== index),
    })),
  outputs: [],
  addOutputItem: (output) =>
    set((state) => ({ outputs: [...state.outputs, output] })),
  updateOutputItem: (index, value) =>
    set((state) => ({
      outputs: state.outputs.map((item, i) => (i === index ? value : item)),
    })),
  removeOutputItem: (index) =>
    set((state) => ({
      outputs: state.outputs.filter((_, i) => i !== index),
    })),
  rules: [],
  addRule: (item) =>
    set((state) => ({ rules: [...state.rules, item] })),
  updateRule: (index, value) =>
    set((state) => ({
      rules: state.rules.map((item, i) =>
        i === index ? value : item
      ),
    })),
  removeRule: (index) =>
    set((state) => ({
      rules: state.rules.filter((_, i) => i !== index),
    })),

  // Step 2 - Requirements
  requiredData: [],
  addRequiredData: (item) =>
    set((state) => ({ requiredData: [...state.requiredData, item] })),
  updateRequiredData: (index, value) =>
    set((state) => ({
      requiredData: state.requiredData.map((item, i) =>
        i === index ? value : item
      ),
    })),
  removeRequiredData: (index) =>
    set((state) => ({
      requiredData: state.requiredData.filter((_, i) => i !== index),
    })),
  toolsFunctions: [],
  addToolsFunction: (item) =>
    set((state) => ({ toolsFunctions: [...state.toolsFunctions, item] })),
  updateToolsFunction: (index, value) =>
    set((state) => ({
      toolsFunctions: state.toolsFunctions.map((item, i) =>
        i === index ? value : item
      ),
    })),
  removeToolsFunction: (index) =>
    set((state) => ({
      toolsFunctions: state.toolsFunctions.filter((_, i) => i !== index),
    })),
  logicalConcepts: [],
  addLogicalConcept: (item) =>
    set((state) => ({ logicalConcepts: [...state.logicalConcepts, item] })),
  updateLogicalConcept: (index, value) =>
    set((state) => ({
      logicalConcepts: state.logicalConcepts.map((item, i) =>
        i === index ? value : item
      ),
    })),
  removeLogicalConcept: (index) =>
    set((state) => ({
      logicalConcepts: state.logicalConcepts.filter((_, i) => i !== index),
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
  pythonCode: "# Write your Python code here\n",
  setPythonCode: (code) => set({ pythonCode: code }),
  codeNotes: [],
  addCodeNote: (item) =>
    set((state) => ({ codeNotes: [...state.codeNotes, item] })),
  updateCodeNote: (index, value) =>
    set((state) => ({
      codeNotes: state.codeNotes.map((item, i) =>
        i === index ? value : item
      ),
    })),
  removeCodeNote: (index) =>
    set((state) => ({
      codeNotes: state.codeNotes.filter((_, i) => i !== index),
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
    set((state) => ({ optimizationRules: [...state.optimizationRules, item] })),
  updateOptimizationRule: (index, value) =>
    set((state) => ({
      optimizationRules: state.optimizationRules.map((item, i) =>
        i === index ? value : item
      ),
    })),
  removeOptimizationRule: (index) =>
    set((state) => ({
      optimizationRules: state.optimizationRules.filter((_, i) => i !== index),
    })),

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
      pythonCode: "# Write your Python code here\n",
      codeNotes: [],
      testCases: [],
      isTesting: false,
      optimizationRules: [],
      nodes: [],
      edges: [],
      activeNodeId: null,
    }),
    }),
    {
      name: 'logic-builder-storage',
    },
  ),
);

export type { LogicFlowState };
