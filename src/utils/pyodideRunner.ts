declare global {
  interface Window {
    loadPyodide: (config: { indexURL: string }) => Promise<any>;
  }
}

export interface RunResult {
  success: boolean;
  stdout: string;
  stderr: string;
  error?: string;
  validationError?: string;
}

let pyodideInstance: any = null;
let loadPromise: Promise<any> | null = null;

export async function getPyodide(): Promise<any> {
  if (pyodideInstance) return pyodideInstance;
  if (loadPromise) return loadPromise;

  if (typeof window.loadPyodide === "undefined") {
    throw new Error("Pyodide script not loaded in index.html or still loading");
  }

  loadPromise = window.loadPyodide({
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/",
  }).then((py) => {
    pyodideInstance = py;
    return py;
  });

  return loadPromise;
}

export async function runPythonCode(
  code: string,
  options: {
    validationType?: "stdout" | "eval" | "none";
    validationCode?: string;
    expectedOutput?: string;
    onStdout?: (text: string) => void;
    onStderr?: (text: string) => void;
  } = {}
): Promise<RunResult> {
  const py = await getPyodide();

  const stdoutBuffer: string[] = [];
  const stderrBuffer: string[] = [];

  // Setup redirection
  py.setStdout({
    batched: (str: string) => {
      stdoutBuffer.push(str);
      if (options.onStdout) options.onStdout(str);
    }
  });

  py.setStderr({
    batched: (str: string) => {
      stderrBuffer.push(str);
      if (options.onStderr) options.onStderr(str);
    }
  });

  try {
    // Fix Globals Pollution Bug:
    // Create an isolated local dictionary namespace so previous runs' variables do not pollute current environment
    const dict = py.globals.get("dict")();

    // Run the main user code inside the isolated dictionary
    await py.runPythonAsync(code, { globals: dict });

    const finalStdout = stdoutBuffer.join("\n").trim();
    const finalStderr = stderrBuffer.join("\n").trim();

    let passed = false;
    let validationError = "";

    const cleanStdout = finalStdout.replace(/\r\n/g, "\n");

    if (options.validationType === "stdout" && typeof options.expectedOutput !== "undefined") {
      const expected = options.expectedOutput.trim().replace(/\r\n/g, "\n");
      if (cleanStdout === expected) {
        passed = true;
      } else {
        validationError = `Очікувалося виведення:\n"${expected}"\n\nОтримано:\n"${cleanStdout}"`;
      }
    } else if (options.validationType === "eval" && options.validationCode) {
      // Run the validation code in the SAME isolated dictionary namespace
      // This allows validation code to inspect user variables (e.g. course_name, remainder)
      try {
        await py.runPythonAsync(options.validationCode, { globals: dict });
        passed = true;
      } catch (valErr: any) {
        passed = false;
        // Parse the error, extract assert descriptions
        const errLines = valErr.message.split("\n");
        let valErrorMsg = errLines[errLines.length - 2] || valErr.message;
        if (valErrorMsg.includes("AssertionError:")) {
          valErrorMsg = valErrorMsg.replace("AssertionError:", "Помилка відповідності:").trim();
        }
        validationError = valErrorMsg;
      }
    } else {
      // "none" validation (playground code)
      passed = true;
    }

    // Clean up namespace
    dict.destroy();

    return {
      success: passed,
      stdout: finalStdout,
      stderr: finalStderr,
      validationError: validationError || undefined,
    };
  } catch (error: any) {
    // Handle script syntax/runtime errors
    const errorMsg = error.message;
    const lines = errorMsg.split("\n");
    // Extract readable traceback snippet (last 4 lines)
    let readableError = lines.slice(-4).join("\n").trim();
    if (!readableError) {
      readableError = errorMsg;
    }

    if (options.onStderr) {
      options.onStderr(readableError);
    }

    return {
      success: false,
      stdout: stdoutBuffer.join("\n").trim(),
      stderr: readableError,
      error: readableError,
    };
  }
}
