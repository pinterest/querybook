---
id: add_query_engine
title: Query Engine
sidebar_label: Query Engine
---

## Adding a new query engine

### Development

Adding a query engine in DataHub is simple.

1.  Configure what data is needed to start the query engine, and what languages it supports. Use FormField from `lib/form/` to determine the shape of the template input. You can then put the template under lib/query_executor/executor_template/\<the name of the engine\>.py

2.  Moving on to adding the client and cursor. The client would accept the input that is configured in the template above
    and use that to establish a new connection. The cursor class handles the actual execution of the query and the data
    fetching process at the end. Please add your code under `common/query_executor/clients/<name of the engine>.py` and make sure they extend the base classes
    in base_client.py.

3.  If you need custom parsing logic for connection string such as getting additional options, please add the logic under `common/query_executor/connection_string/`.

4.  Finally add your executor under `common/query_executor/executors/`. Follow the format of QueryExecutorBaseClass and make sure it is included in the array ALL_EXECUTORS in `common/query_executor/executors/__init__.py`.

5.  Launch the DataHub server, and you should see the new engine showing up in the query engine page of Admin tools.

### Adding the new engine as a plugin

If you cannot include this engine as part of the open source project, you can also add it as a [plugin](../admin_guide/plugins.md).

1. Locate the plugin root directory for your customized DataHub, and find the folder called executor_plugin.
2. Add your engine code similiar to what's above.
3. Make sure it is included in the variable ALL_PLUGIN_EXECUTORS under executor_plugin/\_\_init\_\_.py
