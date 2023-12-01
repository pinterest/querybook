---
id: architecture
title: Architecture
sidebar_label: Architecture
---

## Primary Components

The three components for Querybook are the Web server, the Worker, and the Scheduler. Their functionalities are listed below:

-   **Web Server**: Used to handle HTTP requests, to send/receive Websocket messages, and to provide the static assets for the web.
-   **Worker**: Mainly used to execute long-running queries and scheduled DataDocs. Also used for auxiliary tasks such as updating ElasticSearch docs or analyzing query lineage.
-   **Scheduler**: Reads task schedule from the database and sends it to the Celery workers.

## Infrastructure

Here is the required infrastructure of Querybook.

-   **Database**: Used to store DataDocs, query execution history, etc. Any Sqlalchemy compatible database can be used but MySQL is recommended.
-   **Redis**: Required for sending async tasks to workers, maintaining multi-server WebSocket connections, and caching live data for collaborative editing.
-   **Elasticsearch**: Provides search functionality for database documents such as DataDocs and tables. Also used for table and user autocomplete.
-   **Remote Storage**: Stores the query results. It's advisable to use a large storage service such as S3 since there is no hard limit on the size of data Querybook will pull from the query engine. If not provided, then the database would be used.

![](/img/documentation/Querybook_infra.jpeg)

## Examples

### When a user runs a query

We will walk through the process of composing and executing a query. The first step is to create a DataDoc and write the query in a cell. While the user types, the user’s query gets streamed to the server via Socket.IO. The server then pushes the delta to all users reading that DataDoc via Redis. At the same time, the server would save the updated DataDoc in the database and create an async job for the worker to update the DataDoc content in ElasticSearch. This allows the DataDoc to be searched later.

Once the query is written, the user can execute the query by clicking the run button. The server would then create a record in the database and insert a query job into the Redis task queue. The worker receives the task and sends the query to the query engine (Presto, Hive, SparkSQL, or any Sqlalchemy compatible engine). While the query is running, the worker pushes live updates to the UI via Socket.IO.

When the execution is completed, the worker loads the query result and uploads it in batches to a configurable storage service (e.g. S3). Finally, the browser gets notified of the query completion and makes a request to the server to load the query result and display it to the user.
