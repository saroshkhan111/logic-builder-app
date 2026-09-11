/**
 * @fileoverview Dry Run Visualizer — step-by-step Python code execution tracer.
 *
 * Parses Python code line-by-line and generates a visual trace showing
 * variable state changes, function calls, and control flow.
 * Pure rule-based — no Pyodide required.
 */

/** A single step in the dry run execution trace. */
export interface DryRunStep {
  /** 1-based line number in the original code. */
  lineNumber: number;
  /** The original source code of this line. */
  source: string;
  /** What kind of operation this step represents. */
  type:
    | "assignment"
    | "function_call"
    | "function_def"
    | "return"
    | "print"
    | "expression"
    | "comment"
    | "blank"
    | "control_flow"
    | "other";
  /** Human-readable explanation of what happens at this step. */
  explanation: string;
  /** Variables that were modified at this step (name → value). */
  variablesChanged: Record<string, string>;
  /** All variables visible after this step (name → value). */
  scope: Record<string, string>;
  /** Optional: function call details. */
  functionCall?: {
    name: string;
    args: Record<string, string>;
  };
  /** Optional: return value. */
  returnValue?: string;
  /** Optional: printed output. */
  output?: string;
}

/** Result of a dry run analysis. */
export interface DryRunResult {
  steps: DryRunStep[];
  finalScope: Record<string, string>;
  totalSteps: number;
  hasError: boolean;
  errorMessage?: string;
}

/** Matches a simple variable assignment: `name = value` */
const ASSIGNMENT_RE = /^(\w+)\s*=\s*(.+)$/;

/** Matches a function definition: `def name(args):` */
const FUNCTION_DEF_RE = /^def\s+(\w+)\s*\(([^)]*)\)\s*:/;

/** Matches a return statement: `return value` */
const RETURN_RE = /^return\s+(.+)$/;

/** Matches a print call: `print(...)` */
const PRINT_RE = /^print\s*\((.+)\)$/;

/** Matches an if/elif/else/while/for statement. */
const CONTROL_FLOW_RE = /^(if|elif|else|while|for)\b/;

/** Matches a comment line. */
const COMMENT_RE = /^#/;

/** Matches a blank line. */
const BLANK_RE = /^\s*$/;

/** Matches augmented assignment: `name += value` etc. */
const AUGMENTED_ASSIGN_RE = /^(\w+)\s*(\+=|-=|\*=|\/=)\s*(.+)$/;

/** Matches a standalone expression (function call on its own line). */
const STANDALONE_CALL_RE = /^(\w+)\s*\(([^)]*)\)$/;

/**
 * Attempts to evaluate a simple Python expression to a string representation.
 * Handles literals, basic arithmetic, string concatenation, and f-strings.
 */
function evaluateExpression(expr: string, scope: Record<string, string>): string {
  const trimmed = expr.trim();

  // String literal (single or double quotes)
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed;
  }

  // f-string
  if (trimmed.startsWith('f"') || trimmed.startsWith("f'")) {
    let result = trimmed.slice(2, -1);
    for (const [key, val] of Object.entries(scope)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, "g"), val);
    }
    return `"${result}"`;
  }

  // Numeric literal
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return trimmed;
  }

  // Boolean / None
  if (trimmed === "True") return "True";
  if (trimmed === "False") return "False";
  if (trimmed === "None") return "None";

  // Variable lookup
  if (/^\w+$/.test(trimmed) && trimmed in scope) {
    return scope[trimmed];
  }

  // List literal
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed;
  }

  // Dict literal
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  // Basic arithmetic: a + b, a - b, a * b, a / b
  const arithMatch = trimmed.match(/^(.+?)\s*([+\-*/])\s*(.+)$/);
  if (arithMatch) {
    const [, left, op, right] = arithMatch;
    const leftVal = evaluateExpression(left, scope);
    const rightVal = evaluateExpression(right, scope);
    const leftNum = parseFloat(leftVal.replace(/["']/g, ""));
    const rightNum = parseFloat(rightVal.replace(/["']/g, ""));

    if (!isNaN(leftNum) && !isNaN(rightNum)) {
      let result: number;
      switch (op) {
        case "+":
          result = leftNum + rightNum;
          break;
        case "-":
          result = leftNum - rightNum;
          break;
        case "*":
          result = leftNum * rightNum;
          break;
        case "/":
          result = leftNum / rightNum;
          break;
        default:
          return trimmed;
      }
      return Number.isInteger(result) ? `${result}` : `${parseFloat(result.toFixed(4))}`;
    }

    // String concatenation
    if (op === "+") {
      const l = leftVal.replace(/^["']|["']$/g, "");
      const r = rightVal.replace(/^["']|["']$/g, "");
      return `"${l}${r}"`;
    }

    return `${leftVal} ${op} ${rightVal}`;
  }

  // Comparison operators
  const compMatch = trimmed.match(/^(.+?)\s*(==|!=|<=|>=|<|>)\s*(.+)$/);
  if (compMatch) {
    const [, left, op, right] = compMatch;
    const leftVal = evaluateExpression(left, scope);
    const rightVal = evaluateExpression(right, scope);
    return `${leftVal} ${op} ${rightVal}`;
  }

  // Ternary: value_if_true if condition else value_if_false
  const ternaryMatch = trimmed.match(/^(.+?)\s+if\s+(.+?)\s+else\s+(.+)$/);
  if (ternaryMatch) {
    return ternaryMatch[1].trim();
  }

  // len(), str(), int(), float() builtins
  const builtinMatch = trimmed.match(/^(len|str|int|float)\s*\((.+)\)$/);
  if (builtinMatch) {
    const [, fn, arg] = builtinMatch;
    const argVal = evaluateExpression(arg, scope);
    if (fn === "len") {
      const inner = argVal.replace(/^["']|["']$/g, "");
      return `${inner.length}`;
    }
    if (fn === "str") return `"${argVal.replace(/^["']|["']$/g, "")}"`;
    if (fn === "int") return `${parseInt(argVal, 10) || 0}`;
    if (fn === "float") return `${parseFloat(argVal) || 0}`;
  }

  // If we can't evaluate, return the expression as-is
  return trimmed;
}

/**
 * Parses Python code and generates a step-by-step execution trace.
 * Tracks variable assignments, function calls, and scope changes.
 *
 * @param code - The Python source code to analyze
 * @returns A DryRunResult containing all execution steps
 */
export function traceExecution(code: string): DryRunResult {
  const lines = code.split("\n");
  const steps: DryRunStep[] = [];
  const scope: Record<string, string> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;
    const trimmed = line.trim();

    // Blank line
    if (BLANK_RE.test(trimmed)) {
      steps.push({
        lineNumber,
        source: line,
        type: "blank",
        explanation: "",
        variablesChanged: {},
        scope: { ...scope },
      });
      continue;
    }

    // Comment
    if (COMMENT_RE.test(trimmed)) {
      steps.push({
        lineNumber,
        source: line,
        type: "comment",
        explanation: `Comment: "${trimmed}"`,
        variablesChanged: {},
        scope: { ...scope },
      });
      continue;
    }

    // Control flow (if/elif/else/while/for)
    if (CONTROL_FLOW_RE.test(trimmed)) {
      steps.push({
        lineNumber,
        source: line,
        type: "control_flow",
        explanation: `Control flow: ${trimmed}`,
        variablesChanged: {},
        scope: { ...scope },
      });
      continue;
    }

    // Function definition
    const funcDefMatch = trimmed.match(FUNCTION_DEF_RE);
    if (funcDefMatch) {
      const [, funcName, funcArgs] = funcDefMatch;
      const args = funcArgs
        .split(",")
        .map((a) => a.trim())
        .filter((a) => a.length > 0);
      steps.push({
        lineNumber,
        source: line,
        type: "function_def",
        explanation: `Define function '${funcName}' with parameter(s): ${args.join(", ") || "none"}`,
        variablesChanged: {},
        scope: { ...scope },
      });
      continue;
    }

    // Return statement
    const returnMatch = trimmed.match(RETURN_RE);
    if (returnMatch) {
      const returnValue = evaluateExpression(returnMatch[1], scope);
      steps.push({
        lineNumber,
        source: line,
        type: "return",
        explanation: `Return value: ${returnValue}`,
        variablesChanged: {},
        scope: { ...scope },
        returnValue,
      });
      continue;
    }

    // Print statement
    const printMatch = trimmed.match(PRINT_RE);
    if (printMatch) {
      const output = evaluateExpression(printMatch[1], scope);
      steps.push({
        lineNumber,
        source: line,
        type: "print",
        explanation: `Print: ${output}`,
        variablesChanged: {},
        scope: { ...scope },
        output,
      });
      continue;
    }

    // Augmented assignment (+=, -=, *=, /=)
    const augAssignMatch = trimmed.match(AUGMENTED_ASSIGN_RE);
    if (augAssignMatch) {
      const [, varName, op, value] = augAssignMatch;
      const currentVal = scope[varName] || "0";
      const newVal = evaluateExpression(`${currentVal} ${op[0]} ${value}`, scope);
      scope[varName] = newVal;
      steps.push({
        lineNumber,
        source: line,
        type: "assignment",
        explanation: `${varName} ${op} ${value} → ${varName} = ${newVal}`,
        variablesChanged: { [varName]: newVal },
        scope: { ...scope },
      });
      continue;
    }

    // Simple assignment
    const assignMatch = trimmed.match(ASSIGNMENT_RE);
    if (assignMatch) {
      const [, varName, value] = assignMatch;
      const evaluated = evaluateExpression(value, scope);
      scope[varName] = evaluated;

      // Check if this is a function call result
      const callInValue = value.trim().match(STANDALONE_CALL_RE);
      if (callInValue) {
        const [, callName, callArgs] = callInValue;
        const argsMap: Record<string, string> = {};
        if (callArgs.trim()) {
          callArgs.split(",").forEach((arg, idx) => {
            const argVal = evaluateExpression(arg.trim(), scope);
            argsMap[`arg${idx}`] = argVal;
          });
        }
        steps.push({
          lineNumber,
          source: line,
          type: "function_call",
          explanation: `Call '${callName}()' and assign result to '${varName}'`,
          variablesChanged: { [varName]: evaluated },
          scope: { ...scope },
          functionCall: { name: callName, args: argsMap },
        });
      } else {
        steps.push({
          lineNumber,
          source: line,
          type: "assignment",
          explanation: `Set '${varName}' = ${evaluated}`,
          variablesChanged: { [varName]: evaluated },
          scope: { ...scope },
        });
      }
      continue;
    }

    // Standalone function call (not assignment)
    const standaloneCallMatch = trimmed.match(STANDALONE_CALL_RE);
    if (standaloneCallMatch) {
      const [, callName, callArgs] = standaloneCallMatch;
      const argsMap: Record<string, string> = {};
      if (callArgs.trim()) {
        callArgs.split(",").forEach((arg, idx) => {
          argsMap[`arg${idx}`] = evaluateExpression(arg.trim(), scope);
        });
      }
      steps.push({
        lineNumber,
        source: line,
        type: "function_call",
        explanation: `Call '${callName}()'`,
        variablesChanged: {},
        scope: { ...scope },
        functionCall: { name: callName, args: argsMap },
      });
      continue;
    }

    // Expression (anything else)
    steps.push({
      lineNumber,
      source: line,
      type: "expression",
      explanation: `Execute: ${trimmed}`,
      variablesChanged: {},
      scope: { ...scope },
    });
  }

  return {
    steps: steps.filter((s) => s.type !== "blank"),
    finalScope: { ...scope },
    totalSteps: steps.filter((s) => s.type !== "blank").length,
    hasError: false,
  };
}

/**
 * Formats a dry run result into a human-readable string for display.
 */
export function formatDryRun(result: DryRunResult): string {
  const lines: string[] = [];
  lines.push("╔══════════════════════════════════════════╗");
  lines.push("║       DRY RUN — Step-by-Step Trace       ║");
  lines.push("╚══════════════════════════════════════════╝");
  lines.push("");

  for (const step of result.steps) {
    if (step.type === "blank" || step.type === "comment") continue;

    lines.push(`Line ${step.lineNumber}: ${step.source.trim()}`);
    lines.push(`  → ${step.explanation}`);

    if (Object.keys(step.variablesChanged).length > 0) {
      for (const [key, val] of Object.entries(step.variablesChanged)) {
        lines.push(`  📦 ${key} = ${val}`);
      }
    }

    if (step.output) {
      lines.push(`  🖨️  Output: ${step.output}`);
    }

    if (step.returnValue) {
      lines.push(`  ↩️  Returns: ${step.returnValue}`);
    }

    lines.push("");
  }

  if (Object.keys(result.finalScope).length > 0) {
    lines.push("─────────────────────────────────────────");
    lines.push("Final Variables:");
    for (const [key, val] of Object.entries(result.finalScope)) {
      lines.push(`  ${key} = ${val}`);
    }
  }

  return lines.join("\n");
}
