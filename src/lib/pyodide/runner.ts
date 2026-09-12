declare global {
  interface Window {
    loadPyodide?: (config: { indexURL: string }) => Promise<unknown>;
    pyodide?: unknown;
  }
}

export interface PyodideResult {
  output: string;
  error: string | null;
}

/**
 * Normalizes a captured stdout buffer so every test case gets an independent
 * expected output:
 * - trims surrounding whitespace
 * - if several lines were printed/leaked, keeps ONLY the last non-empty line
 *   (the current run's actual answer). Earlier lines are treated as leaked
 *   leftovers from a previous run and are dropped.
 */
export const normalizePyOutput = (raw: unknown): string => {
  if (typeof raw !== "string" || raw.trim() === "") return "";
  const nonEmpty = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "");
  return nonEmpty.length > 0 ? nonEmpty[nonEmpty.length - 1] : "";
};

interface PyodideInstance {
  runPythonAsync: (code: string) => Promise<unknown>;
}

let pyodideInstance: PyodideInstance | null = null;

export const getPyodide = async (): Promise<PyodideInstance> => {
  if (pyodideInstance) return pyodideInstance;

  if (typeof window !== "undefined" && window.loadPyodide) {
    pyodideInstance = (await window.loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/",
    })) as PyodideInstance;
    return pyodideInstance;
  }

  throw new Error("Pyodide script is not loaded in window.");
};

export const runPythonCode = async (
  code: string,
  inputVal?: string
): Promise<PyodideResult> => {
  try {
    const pyodide = await getPyodide();

    // Redirect sys.stdout to a FRESH StringIO on every single run so output
    // from one test case can never leak into the next one.
    const setupScript = `
import sys
import io

sys.stdout = io.StringIO()
`;
    await pyodide.runPythonAsync(setupScript);

    // Mock built-in input() if test case inputs are provided
    if (inputVal !== undefined) {
      const inputScript = `
import builtins
input_values = ${JSON.stringify(inputVal.split("\n"))}
input_index = 0

def mock_input(prompt=""):
    global input_index
    if input_index < len(input_values):
        val = input_values[input_index]
        input_index += 1
        return val
    return ""

builtins.input = mock_input
`;
      await pyodide.runPythonAsync(inputScript);
    }

    // Execute user code. The smart wrappers (buildExecutionScript) end with a
    // bare `sys.stdout.getvalue()` expression, so runPythonAsync resolves to
    // the captured output of THIS run only - captured atomically inside the
    // same call, before pyodide can touch/restore sys.stdout afterwards.
    const result = await pyodide.runPythonAsync(code);

    let rawOutput = "";
    if (typeof result === "string") {
      rawOutput = result;
    } else {
      // Direct/raw code (e.g. optimization benchmarks) may not end with an
      // expression - fall back to reading the session buffer explicitly.
      const fallback = await pyodide.runPythonAsync("sys.stdout.getvalue()");
      if (typeof fallback === "string") rawOutput = fallback;
    }

    // Wipe the buffer after every run so nothing lingers in the session even
    // if the next call's setup script fails part-way.
    try {
      await pyodide.runPythonAsync("sys.stdout = io.StringIO()");
    } catch {
      // Ignore - the next run re-creates the buffer anyway.
    }

    return {
      output: normalizePyOutput(rawOutput),
      error: null,
    };
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "An error occurred during Python execution.";
    return {
      output: "",
      error: errorMessage,
    };
  }
};
// ---------------------------------------------------------------------------
// Universal Code Executor
// ---------------------------------------------------------------------------
// Handles every style of user code: return-only functions, print-only
// functions, functions that do both, multiple functions, input() driven
// code, multi-line output, and plain scripts.

export interface FunctionDef {
  name: string;
  params: string[];
}

/** Parses top-level `def` statements (column 0) into { name, params } pairs. */
export const extractTopLevelFunctions = (code: string): FunctionDef[] => {
  const defs: FunctionDef[] = [];
  const pattern = /^def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)\s*:/gm;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(code)) !== null) {
    const params = match[2]
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p !== "");
    defs.push({ name: match[1], params });
  }
  return defs;
};

/** Entry-point names we prefer when the user defines multiple functions. */
const PREFERRED_FUNCTION_NAMES = ["main", "solution", "solve", "run", "execute"];

/**
 * Picks the function the test runner should call:
 * - no functions       -> null (plain script, run as-is)
 * - exactly one        -> that function
 * - multiple functions -> preferred name (main/solution/...), else a function
 *                         whose parameter count matches the number of input
 *                         values, else the last function defined.
 */
export const selectFunctionDef = (
  pythonCode: string,
  argCount: number
): FunctionDef | null => {
  const defs = extractTopLevelFunctions(pythonCode);
  if (defs.length === 0) return null;
  if (defs.length === 1) return defs[0];

  for (const name of PREFERRED_FUNCTION_NAMES) {
    const found = defs.find((d) => d.name === name);
    if (found) return found;
  }

  const exact = defs.filter((d) => d.params.length === argCount);
  if (exact.length === 1) return exact[0];
  if (exact.length > 1) return exact[exact.length - 1];

  return defs[defs.length - 1];
};

/**
 * True when the function is already invoked by top-level (column 0) code.
 * In that case the user wrote a script that drives the function itself, so we
 * must NOT auto-call it again (that would double-execute and could consume
 * the mocked input() values twice).
 */
export const isCalledAtTopLevel = (code: string, funcName: string): boolean => {
  const escaped = funcName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `^(?!def\\b|class\\b|import\\b|from\\b|@|#)\\S.*\\b${escaped}\\s*\\(`,
    "m"
  );
  return pattern.test(code);
};

/** Splits a test case input into positional argument tokens. */
export const parseInputTokens = (testInput: string): string[] => {
  const trimmed = (testInput ?? "").trim();
  if (trimmed === "") return [];

  const lines: string[] = [];
  for (const line of trimmed.split(/\r?\n/)) {
    const clean = line.trim();
    if (clean !== "") lines.push(clean);
  }
  if (lines.length > 1) return lines;

  // A single line may already be comma separated, e.g. "5, 3".
  const commaParts = lines[0]
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p !== "");
  return commaParts.length > 1 ? commaParts : [lines[0]];
};

/** Renders one input token as a valid Python argument literal. */
const formatPythonValue = (raw: string): string => {
  const value = raw.trim();
  if (value === "") return '""';
  // numbers
  if (/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(value)) return value;
  // boolean / None literals
  if (/^(True|False|None)$/.test(value)) return value;
  // already a list / tuple / dict literal
  if (/^(\[.*\]|\(.*\)|{.*})$/.test(value)) return value;
  // already a quoted string
  if (/^(["']).*\1$/.test(value)) return value;
  // bare value -> treat as a string, e.g. hello -> "hello"
  return JSON.stringify(value);
};

/** Builds the argument list embedded in the function-call wrapper. */
export const buildFunctionArgs = (testInput: string): string =>
  parseInputTokens(testInput).map(formatPythonValue).join(", ");

/**
 * Smart execution wrapper.
 *
 * Case 1 - function: runs the user code, calls the selected function with the
 * test input, and:
 *   - prints the return value only when the code printed nothing itself
 *   - keeps the printed output otherwise (handles print + return together)
 *   - turns runtime errors into visible "ERROR: ..." output per test case
 *
 * Case 2 - script: simply runs the code and keeps its printed output.
 * input() based scripts are handled by the mock installed in runPythonCode.
 */
export const buildExecutionScript = (
  pythonCode: string,
  funcName: string | null,
  testInput: string
): string => {
  if (funcName) {
    return [
      "import sys, io",
      "sys.stdout = io.StringIO()",
      "",
      pythonCode,
      "",
      "try:",
      `    _result = ${funcName}(${testInput})`,
      "    # Print return value only if function didn't print anything",
      "    if _result is not None:",
      "        _captured = sys.stdout.getvalue()",
      "        if not _captured.strip():",
      "            print(_result)",
      "    else:",
      "        _captured = sys.stdout.getvalue()",
      "except Exception as e:",
      '    print(f"ERROR: {e}")',
      "",
      "sys.stdout.getvalue()",
    ].join("\n");
  }

  return [
    "import sys, io",
    "sys.stdout = io.StringIO()",
    "",
    pythonCode,
    "",
    "sys.stdout.getvalue()",
  ].join("\n");
};

/**
 * One-call entry point shared by the test generator and the test runner so
 * expected and actual outputs are always produced by the same logic.
 */
export const runSmartPythonCode = async (
  pythonCode: string,
  inputVal?: string
): Promise<PyodideResult> => {
  const argCount = parseInputTokens(inputVal ?? "").length;
  const funcDef = selectFunctionDef(pythonCode, argCount);
  const funcName =
    funcDef && !isCalledAtTopLevel(pythonCode, funcDef.name)
      ? funcDef.name
      : null;

  // Only pass positional arguments when the chosen function accepts them;
  // otherwise the values are consumed through the mocked input().
  const args =
    funcDef && funcDef.params.length > 0
      ? buildFunctionArgs(inputVal ?? "")
      : "";

  const script = buildExecutionScript(pythonCode, funcName, args);
  return runPythonCode(script, inputVal ?? "");
};