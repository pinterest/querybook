---
id: add_table_upload
title: Table Upload
sidebar_label: Table Upload
---

:::warning
This is an experimental feature. You can use the plugins for customization but they may break in future updates.
:::

## Overview

Users can now upload local CSV files or use a Querybook query execution results to create a SQL table.
This is supported by loading the data into a Pandas DataFrame and then exporting it to the desired query engine.

## Supported Upload Types

Currently, there are 2 ways to upload the data:

-   Via file upload. Supports CSV/TSV and similar variations
-   Via reading from query execution results

The upload process currently does not support custom plugins. If you do want to add additional ways to upload tables, please let us know either on Github or Slack.

## Supported Ingestion Types

When ingesting data to SQL DB, 3 different types are supported:

### Generic SQLAlchemy exporter

This uses Pandas' to_sql feature to convert the data to an `insert` statement. This exporter only works with query engines that are based on SQLAlchemy.

Included by default: Yes

Available options: None

### S3 CSV exporter

This would upload the Pandas DataFrame as CSV to S3, and create an external table on top of it. Dependencies such as boto3 must be installed.

Included by default: No

Available options:

Either s3_path or use_schema_location must be supplied.

-   s3_path (str): if supplied, will use it as the root path for upload. Must be the full s3 path like s3://bucket/key, the trailing / is optional.
-   use_schema_location (boolean):
    if true, the upload root path is inferred by locationUri specified by the schema/database in HMS. To use this option, the engine must be connected to a metastore that uses
    HMSMetastoreLoader (or its derived class).
-   table_properties (List[str]): list of table properties passed, this must be query engine specific.
    Checkout here for examples in SparkSQL: https://spark.apache.org/docs/latest/sql-ref-syntax-ddl-create-table-hiveformat.html#examples
    For Trino/Presto, it would be the WITH statement: https://trino.io/docs/current/sql/create-table.html

### S3 Parquet exporter

This would upload a Parquet file instead of a CSV file. In addition to dependencies such as boto3, `pyarrow` must also be installed.

Included by default: No

Available options: See S3 CSV exporter.

## How to use

### Step 1: Installation and configuration

Before starting, please make sure the following is prepared:

-   Dependencies such as boto3 and pyarrow are installed (if using Parquet exporter). Check out [Infra Installation](../configurations/infra_installation) on what version to use.
-   A query engine with a query metastore configured.

Now add the table upload exporter you would need to ALL_PLUGIN_TABLE_UPLOAD_EXPORTERS under `table_uploader_plugin`. To learn how to use plugins, checkout the [plugin guide](plugins.md).

Note the SQLAlchemy exporter is included by default, and S3 exporters need to be added via plugins.

### Step 2: Add table uploader to the query engine

Once Querybook is ready, go to the admin Query Engine page (`/admin/query_engine/`). Go to the `Additional Features` section and choose an appropriate table upload exporter.

### Step 3: Upload tables

Once the set up is complete, users who refresh the page should now see a `+` button on the top of Tables sidebar. Clicking on it would start the table creation flow.

Alternatively, you can view any query execution and hover over the `export` button. If there is any query engine in the environment that supports table upload, there should be an option shown to
let you export the query results directly to a table.
