---
id: add_exporter
title: Exporter
sidebar_label: Exporter
---

## What is an exporter?

Exporter provides a shortcut for users to move their query results to the desired location. It is designed to be generalizable to satisfy needs in different orgs. Some example of exports are:

-   Export to Google Sheets, Microsoft 365
-   Export as a Python script, to run further analysis in Jupyter
-   Export to another internal site that provides more suitable visualization
-   Export to query result on a Slack channel

## Implementation

To keep the exporting process standardized, please create an exporter under <project_root>/querybook/server/lib/export/exporters. All exporters must inherit from BaseExporter that lives in <project_root>/querybook/server/lib/export/base_exporter.py.

Here are some fields of exporter that you must configure in the setup process:

-   EXPORTER_NAME: This will get displayed on the Querybook website.
-   EXPORTER_TYPE: There are 2 types of exporters:
    -   `url`: This is useful for something like export to Google Sheets. This kind of exporter must return an url that can be opened by the user.
    -   `text`: This is useful when you want to generate some text for user to copy (i.e export to python). Text export is only recommend for non-db query stores\*.
-   export(cls, statement_id, user_id): This is the actual export function. Statement id is provided to grab the query result and user id provides a way to ensure the exported result is securely owned by the user.

(\* This is because currently db based query store does not provide a download url for security reasons, this should be a non-issue once one time user signed token is implemented on Querybook)

To ensure Querybook more generalizable, all exporters are not included by default. If you want to add an exporter, please do so through plugins (See this [Plugin Guide](plugins.md) to learn how to setup plugins for Querybook).

Once plugins folder is setup, import the exporter class under `ALL_PLUGIN_EXPORTERS` in `exporter_plugin/__init__.py`. As an example, here is how you can add PythonExporter and RExporter:
```python
from lib.export.exporters.python_exporter import PythonExporter
from lib.export.exporters.r_exporter import RExporter

ALL_PLUGIN_EXPORTERS = [
    PythonExporter(),
    RExporter()
]
```
