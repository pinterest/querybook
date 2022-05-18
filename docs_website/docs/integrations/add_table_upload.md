---
id: add_table_upload
title: Table Upload
sidebar_label: Table Upload
---

:::warning
This is an experimental feature with no plugin support. You can modify the source code to include custom behavior
but they may break in future updates.
:::

## Overview

Users can now upload local CSV files or use a Querybook query execution results to create a SQL table.
This is supported by loading the data into a Pandas DataFrame and then exporting it to the desired query engine.

## Supported Upload Types

Currently, there are 2 ways to upload the data:

-   Via file upload. Supports CSV/TSV and similar variations
-   Via reading from query execution results

When ingesting data to SQL DB, 3 different types are supported:

-   Generic SQLAlchemy exporter. This uses Pandas' to_sql feature to convert the data to an `insert` statement. This exporter only works with query engines that are based on SQLAlchemy.
-   S3 CSV exporter. This would upload the Pandas DataFrame as CSV to S3, and create an external table on top of it. Dependencies such as boto3 must be installed.
-   S3 Parquet exporter. This would upload a Parquet file instead of a CSV file. In addition to dependencies such as boto3, `pyarrow` must also be installed.

## How to use

Before starting, please make sure the following is prepared:

-   Dependencies such as boto3 and pyarrow are installed (if they are needed). Check out [Infra Installation](../configurations/infra_installation) on what version to use.
-   A query engine with a query metastore configured.

Once Querybook is ready, go to the admin Query Engine page (`/admin/query_engine/`). Go to the `Additional Features` section and choose an appropriate table upload exporter. Once this is saved, users
who refresh the page should now see a `+` button on the top of Tables sidebar. Clicking on it would start the table creation flow.

Alternatively, you can view any query execution and hover over the `export` button. If there is any query engine in the environment that supports table upload, there should be an option shown to
let you export the query results directly to a table.
