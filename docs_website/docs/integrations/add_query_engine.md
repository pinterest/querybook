---
id: add_query_engine
title: Query Engine
sidebar_label: Query Engine
---

## Adding a new query engine

### Development

Adding a query engine in Querybook is simple.

1.  Configure what data is needed to start the query engine, and what languages it supports. Use FormField from `lib/form/` to determine the shape of the template input. You can then put the template under lib/query_executor/executor_template/\<the name of the engine\>.py

2.  Moving on to adding the client and cursor. The client would accept the input that is configured in the template above
    and use that to establish a new connection. The cursor class handles the actual execution of the query and the data
    fetching process at the end. Please add your code under `common/query_executor/clients/<name of the engine>.py` and make sure they extend the base classes
    in base_client.py.

3.  If you need custom parsing logic for connection string such as getting additional options, please add the logic under `common/query_executor/connection_string/`.

4.  Finally add your executor under `common/query_executor/executors/`. Follow the format of QueryExecutorBaseClass and make sure it is included in the array ALL_EXECUTORS in `common/query_executor/executors/__init__.py`.

5.  Launch the Querybook server, and you should see the new engine showing up in the query engine page of Admin tools.

### Adding the new engine as a plugin

If you cannot include this engine as part of the open source project, you can also add it as a [plugin](plugins.md).

1. Locate the plugin root directory for your customized Querybook, and find the folder called executor_plugin.
2. Add your engine code similiar to what's above.
3. Make sure it is included in the variable ALL_PLUGIN_EXECUTORS under executor_plugin/\_\_init\_\_.py

## What can be customized

Given most query engines can be used via Sqlalchemy connectors, the primary use case for creating your own query engine is to customize its behaviors to ensure it is secure and user friendly. In this section, we will go over some examples of customization done at Pinterest to see how a query engine can be configured.

### Authentication

The default query engines require a fixed SQL connection string (e.g. MySQL://username:password@host:port/database) to authenticate to the query engine. However, you might want to do the following:

-   proxy user so that the query engine can perform another check on whether or not the user has access
-   use user's auth token to connect to the query engine instead
-   use service discovery such as zookeeper to load balance the host

To add a query engine, you would need to add a client and an executor. When the Querybook initializes the client, it will always pass a parameter called `proxy_user` to the client to represent the user who requested the query. The proxy_user field is the **unique** username string in Querybook database's Users table. You can use this to fetch more information about the user (e.g. email) and pass it to the query engine. For example, the Presto implementation provided by Querybook would write the proxy user to the 'Proxy-Authorization' header of the HTTP requests. If you want to pass additional tokens such as JWT, you would need to first customize the [authentication](add_auth.md) to store the JWT into the user.properties when the user logs in and then pass the `proxy_user`'s JWT to the query engine.

To use service discovery, modify the `EXECUTOR_TEMPLATE` so that it accepts the zookeeper connection details. Alternatively, you can also modify how the connection string is parsed. Check out the Hive executor for an example.

### Exceptions

Querybook can be customized to give users more info when the query execution process throws an exception. There are 3 query execution categories currently in Querybook:

```py
class QueryExecutionErrorType(Enum):
    INTERNAL = 0  # Error came from python exception caused by celery worker
    ENGINE = 1  # Error was thrown from the query engine
    SYNTAX = 2  # Error is thrown from query engine and is caused by syntax
```

By default, all exceptions are categorized as `INTERNAL` because Querybook does not differentiate between exceptions thrown by Querybook or by the query engine. However, if the exceptions thrown by the query engine are all inherited from an error class, then you can override the `_parse_exception` to check if it is from the query engine.
A common case of query engine errors is the syntax error. Querybook provides a special UI for syntax error to show the user where exactly the syntax error is. If you want this integration for your own customized query engine, you should return by calling the function `get_parsed_syntax_error` with the line number and the starting character position. To see the actual code usage, check out the examples in executors/presto.py and hive.py.

### Meta

When a query is running, run time information can be extracted in the form of percentage completion, logs, and meta. This information gets streamed live via Websocket to the user. While the former two are specific, the meta form can contain free-formed markdown information that provides a summary to the query runner. As an example, when a user runs a Presto query, the meta field can contain the Presto tracking URL for them to check out more details about the query. The tracking URL to meta info behavior is provided by the base client and the base executor, which means the only implementation required by the developer is to generate the tracking URL in the inherited client.

However, you may want to extend the meta_info function in the QueryExecutorBaseClass to provide other info to the user. For example, you can provide multiple URLs (e.g. log URL) or runtime query warnings to the user. By default, the meta field is only shown to the user while the query is running, and is collapsed by default. In case you do want to show the meta info to the user after a query has been completed, you can add the following text to the meta:

```
---
force_show: true
---
```

In the frontend, this part of the text will be parsed and removed from the meta.
