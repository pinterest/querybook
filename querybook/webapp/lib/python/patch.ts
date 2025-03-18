export async function patchPyodide(pyodide: {
    runPythonAsync: (code: string) => Promise<any>;
}) {
    await patchPrint(pyodide);
    await patchMatplotlib(pyodide);
    await createDataFrameHelper(pyodide);
}

/**
 * Patches the built-in Python `print` function to handle special cases for DataFrames, lists, and dictionaries.
 * - DataFrames are serialized as JSON with their columns and records.
 * - Lists and dictionaries are serialized as JSON.
 * - Other types are printed using the original `print` function.
 *
 * This ensures that outputs from Python code executed in Pyodide are structured and can be easily consumed
 * by the frontend.
 *
 * @param pyodide - The Pyodide instance with a `runPythonAsync` method to execute Python code.
 */
async function patchPrint(pyodide: {
    runPythonAsync: (code: string) => Promise<any>;
}) {
    await pyodide.runPythonAsync(`
  import json
  import pandas as pd
  import builtins

  # Store the original print function
  _original_print = builtins.print

  # Define a new print function that catches DataFrames, lists, and dicts and prints them as JSON
  def _custom_print(*args, **kwargs):
      for arg in args:
          if isinstance(arg, pd.DataFrame):
              df = arg.reset_index()
              columns = df.columns.tolist()
              records = df.to_dict(orient='records')
              _original_print(json.dumps({"type":"dataframe", "columns":columns, "records":records}))

          elif isinstance(arg, (list, dict)):
              try:
                  # Try to serialize and print the data as JSON
                  _original_print(json.dumps({"type":"json", "data": arg}))
              except:
                  _original_print(arg, **kwargs)
          else:
              _original_print(arg, **kwargs)

  # Replace the built-in print function
  builtins.print = _custom_print
  `);
}

/**
 * Patches the Matplotlib library to ensure compatibility with Pyodide's browser environment.
 * - Sets the Matplotlib backend to "AGG" (a non-interactive backend) to avoid GUI-based rendering issues.
 * - Overrides the `show` function to capture plots as base64-encoded PNG images.
 *
 * This allows plots generated in Python to be serialized as base64 strings and sent to the frontend
 * for rendering, as Pyodide does not support direct GUI-based plot rendering.
 *
 * @param pyodide - The Pyodide instance with a `runPythonAsync` method to execute Python code.
 */
async function patchMatplotlib(pyodide: {
    runPythonAsync: (code: string) => Promise<any>;
}) {
    // Set the Matplotlib backend to "AGG" to ensure compatibility with non-GUI environments.
    await pyodide.runPythonAsync(`
  import os
  os.environ["MPLBACKEND"] = "AGG"
  `);

    // Patch Matplotlib's `show` function to capture plots as base64-encoded PNG images.
    await pyodide.runPythonAsync(`
  import base64
  import json
  from io import BytesIO

  import matplotlib.pyplot

  def ensure_matplotlib_patch():
      def show():
          buf = BytesIO()
          matplotlib.pyplot.savefig(buf, format='png')
          buf.seek(0)
          # encode to a base64 str
          img = base64.b64encode(buf.read()).decode('utf-8')
          print(json.dumps({"type": "image", "data": img}))

      matplotlib.pyplot.show = show

  ensure_matplotlib_patch()
  `);
}

/**
 * Adds a helper function to the Pyodide environment for creating Pandas DataFrames.
 * - This function allows the frontend to pass records (data) and column names to Python
 *   and create a Pandas DataFrame from them.
 *
 * This is particularly used for exporting query results from the query cell as a DataFrame,
 * enabling further manipulation or analysis in Python.
 *
 * @param pyodide - The Pyodide instance with a `runPythonAsync` method to execute Python code.
 */
async function createDataFrameHelper(pyodide: {
    runPythonAsync: (code: string) => Promise<any>;
}) {
    await pyodide.runPythonAsync(`
  import pandas as pd

  def _create_dataframe(records, columns):
    return pd.DataFrame(records, columns=columns)
  `);
}
