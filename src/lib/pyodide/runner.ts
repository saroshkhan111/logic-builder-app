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

    // Redirect sys.stdout to capture print outputs
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

    // Execute user code
    await pyodide.runPythonAsync(code);

    // Retrieve standard output
    const stdout = (await pyodide.runPythonAsync(
      "sys.stdout.getvalue()"
    )) as string;

    return {
      output: stdout ? stdout.trim() : "",
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