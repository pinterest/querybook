import { PyodideInterface } from 'pyodide';

import { querybookModule } from './querybook';

export async function patchPyodide(pyodide: PyodideInterface) {
    pyodide.registerJsModule('querybook', querybookModule);
    await patchPrint(pyodide);
    await patchMatplotlib(pyodide);
    await patchDataFrameHelper(pyodide);
    await patchNamespaceHelper(pyodide);
}

/**
 * Patches the built-in Python `print` function to handle special cases for DataFrames, lists, dictionaries, and NumPy arrays.
 * - DataFrames are serialized as JSON with their columns and records.
 * - Lists, dictionaries, and NumPy arrays are serialized as JSON.
 * - Other types are printed using the original `print` function.
 *
 * This ensures that outputs from Python code executed in Pyodide are structured and can be easily consumed
 * by the frontend.
 *
 * @param pyodide - The Pyodide instance with a `runPythonAsync` method to execute Python code.
 */
async function patchPrint(pyodide: PyodideInterface) {
    await pyodide.runPythonAsync(`
  import json
  import pandas as pd
  import numpy as np
  import builtins

  # Store the original print function
  _original_print = builtins.print

  # Helper function to normalize DataFrame columns
  def _normalize_dataframe_columns(df):
      if hasattr(df.columns, 'nlevels') and df.columns.nlevels > 1:
          # Flatten MultiIndex columns by joining with pipe, avoiding empty parts
          return [' | '.join(str(part) for part in col if str(part).strip()).strip() for col in df.columns.values]
      else:
          return df.columns

  # Helper function to convert objects to JSON-serializable format
  def _make_serializable(obj):
      if isinstance(obj, pd.DataFrame):
          df = obj.reset_index()
          df.columns = _normalize_dataframe_columns(df)
          return {
                "type": "dataframe",
                "data": {
                    "columns": df.columns.tolist(),
                    "records": df.to_dict(orient='records')
                }
          }
      elif isinstance(obj, np.ndarray):
          return obj.tolist()
      elif isinstance(obj, (list, tuple)):
          return [_make_serializable(item) for item in obj]
      elif isinstance(obj, dict):
          return {key: _make_serializable(value) for key, value in obj.items()}
      else:
          # For other types, try to keep them as-is if they're JSON serializable
          try:
              json.dumps(obj)
              return obj
          except TypeError:
              # If not serializable, convert to string representation
              return str(obj)

  # Define a new print function that handles special data types as JSON
  def _custom_print(*args, **kwargs):
      for arg in args:
          if isinstance(arg, (pd.DataFrame, np.ndarray, list, dict, tuple)):
              try:
                  serialized = _make_serializable(arg)
                  # DataFrames already have the correct format, others need wrapping
                  if isinstance(arg, pd.DataFrame):
                      _original_print(json.dumps(serialized))
                  else:
                      _original_print(json.dumps({"type":"json", "data": serialized}))
              except Exception:
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
async function patchMatplotlib(pyodide: PyodideInterface) {
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

  def _ensure_matplotlib_patch():
      def show():
          buf = BytesIO()
          matplotlib.pyplot.savefig(buf, format='png')
          buf.seek(0)
          # encode to a base64 str
          img = base64.b64encode(buf.read()).decode('utf-8')
          print(json.dumps({"type": "image", "data": "data:image/png;base64," + img}))
          matplotlib.pyplot.clf()

      matplotlib.pyplot.show = show

  _ensure_matplotlib_patch()
  `);
}

/**
 * Adds a helper function to the Pyodide environment for creating Pandas DataFrames.
 * - This function allows to create a Pandas DataFrame from a statement execution id.
 *
 * This is particularly used for exporting query results from the query cell as a DataFrame,
 * enabling further manipulation or analysis in Python.
 *
 * @param pyodide - The Pyodide instance with a `runPythonAsync` method to execute Python code.
 */
async function patchDataFrameHelper(pyodide: PyodideInterface) {
    await pyodide.runPythonAsync(`
  import builtins
  import pandas as pd

  async def get_df(statement_execution_id, limit = None):
    """
    Fetches the result of a statement execution and converts it into a Pandas DataFrame.

    Args:
        statement_execution_id (int): The ID of the statement execution to fetch results for.
        limit (int, optional): The maximum number of rows to fetch. Defaults to None, which retrieves up to ${querybookModule.QUERY_STATEMENT_RESULT_SIZE_LIMIT} rows.

    Returns:
        DataFrame: A Pandas DataFrame containing the query results.

    Example:
        df = await get_df(statement_execution_id, 10)
    """
    from querybook import fetchStatementResult
    js_data=await fetchStatementResult(statement_execution_id, limit)
    data = js_data.to_py()
    return pd.DataFrame(data[1:], columns=data[0])

  builtins.get_df = get_df
`);
}

/**
 * Adds a helper function to the Pyodide environment for retrieving the identifiers
 * in a namespace along with their types.
 *
 * @param pyodide - The Pyodide instance with a `runPythonAsync` method to execute Python code.
 */
async function patchNamespaceHelper(pyodide: PyodideInterface) {
    await pyodide.runPythonAsync(`
  import inspect
  import types

  def _get_namespace_identifiers(namespace):
      result = []

      # Get all names in current scope
      for name, obj in namespace.items():
          try:
              # Determine the type (simplified to just 4 types)
              if inspect.ismodule(obj):
                  type_name = "module"
              elif inspect.isclass(obj):
                  type_name = "class"
              elif inspect.isfunction(obj):
                  type_name = "function"
              else:
                  type_name = "variable"

              result.append({
                  "name": name,
                  "type": type_name
              })
          except Exception:
              # Handle cases where eval might fail
              result.append({
                  "name": name,
                  "type": 'unknown'
              })

      return result
  `);
}
