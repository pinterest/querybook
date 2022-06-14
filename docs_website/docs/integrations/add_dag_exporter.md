---
id: add_dag_exporter
title: DAG Exporter
sidebar_label: DAG Exporter
---

## Disclaimer

The current version is experimental and there may be breaking changes in the future.

## What is a dag exporter?

DAG exporter is a way to create a workflow from Query Cells in a Datadoc.

## Implementation

Due to the many ways a workflow app may be configured, it is unlikely that a dag exporter would be added to the open source repo. Please use the plugin to use this feature. To keep the process standardized, please create a dag exporter under <project_root>/querybook/server/lib/export/dag_exporters. All dag exporters must inherit from BaseDAGExporter that lives in <project_root>/querybook/server/lib/export/base_dag_exporter.py.

Here are some fields of exporter that you must configure in the setup process:

-   DAG_EXPORTER_NAME: This will get displayed on the Querybook website.
-   DAG_EXPORTER_TYPE: There are 2 types of exporters:
    -   `url`: This is useful when the created workflow can be accessed by a url.
    -   `text`: This is useful when you want to generate a file for users to create a workflow
-   DAG_EXPORTER_META: This will be displayed as form for users to set the settings for creating the workflow. Must use one of AllFormField that lives in <project_root>/querybook/server/lib/form/\_\_init\_\_.py.
-   export(cls, nodes, edges, meta, cell_by_id): This is the actual export function.

To ensure Querybook more generalizable, all dag exporters are not included by default. If you want to add an exporter, please do so through plugins (See this [Plugin Guide](plugins.md) to learn how to setup plugins for Querybook).

Once plugins folder is setup, import the dagmexporter class under `ALL_PLUGIN_DAG_EXPORTERS` in `dag_exporter_plugin/__init__.py`. As an example, here is how you can add DemoDAGExporter:

```python
from lib.dag_exporter.exporters.demo_dag_exporter import DemoDAGExporter

ALL_DAG_EXPORTERS = [DemoDAGExporter()]

```
