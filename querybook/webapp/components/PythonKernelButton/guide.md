The Python cell in Querybook is powered by [Pyodide](https://pyodide.org/en/stable/index.html), a Python distribution based on WebAssembly that runs entirely on the client side (browser).

## Kernel

The Python kernel initializes alongside Querybook's loading process. You can monitor the initialization status via the hover tooltip of the Python icon located on the right sidebar.

Each DataDoc has its own isolated namespace. Variables in a Python cell are only accessible within the same DataDoc and cannot be shared with other DataDocs. Within a DataDoc, variables from one Python cell can be used in others if the cells are executed in the correct order.

## Packages

By default, only the Python standard library and the following packages are available:

-   numpy
-   pandas
-   matplotlib

**Note**: Some modules have been removed from the standard library to reduce download size and may not work. You can view the list of removed modules [here](https://pyodide.org/en/stable/usage/wasm-constraints.html#removed-modules).

For other Pyodide [built-in packages](https://pyodide.org/en/stable/usage/packages-in-pyodide.html#packages-in-pyodide), you can import them directly, and they will load automatically when the code is executed.

To install other external pure Python packages with wheels, use `micropip`. For example:

```py
import micropip
await micropip.install('seaborn')
```

For more details on package loading, refer to the [Pyodide documentation](https://pyodide.org/en/stable/usage/loading-packages.html#loading-packages).

## Accessing Query Results

To retrieve query results as a `DataFrame`, click the `Copy DataFrame` button located to the left of the `Export` button. This action will copy a code snippet for obtaining the query result. Here is an example snippet:

```py
df = await get_df(1, limit=10)
df
```

**Note**: All columns of the query result are string type. Please convert them to the appropriate types as needed.

For more information about the `get_df` function, run `help(get_df)`.

## Output Rendering

By default, Python output is rendered as plain text, similar to a standard Python REPL, except for the following data types:

-   **DataFrame**: Rendered as a table similar to query results.
-   **JSON**: Rendered as a visualized JSON view.
-   **Plot images from matplotlib**: Rendered as PNG static images.

## Scheduled DataDocs

Since Python cells execute entirely on the client side within the browser, they will be skipped in Scheduled DataDoc runs. Only Query cells are supported for scheduling.
