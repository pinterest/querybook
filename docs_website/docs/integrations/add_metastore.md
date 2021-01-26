---
id: add_metastore
title: Metastore
sidebar_label: Metastore
---

## Overview

Metastore loader provides a way for querybook to know what kind of tables and schemas are queryable by the query engine. The actual loading process is deeply abstracted away to simplify the implementation. Querybook by default provides hive metastore loader (w/ thrift schema support) and sqlalchemy loader which should cover most of the use cases. However you can always make your own metastore loader for efficiency or customization purposes.

## Adding a new Metastore

Please add any new metastore loaders under <project_root>/querybook/server/lib/metastore/loaders/. All of the metastore loaders should inherit `BaseMetastoreLoader` from base_metastore_loader.py. You can also inherit from SqlAlchemyMetastoreLoader or HMSMetastoreLoader to add more fine grained details.

The following functions needs to be overloaded when inheriting from BaseMetastoreLoader:

-   `get_all_schema_names() -> string[]`: Return a list of schema names in the metastore.
-   `get_all_table_names_in_schema(schema_name: str) -> string[]`: Return a list of table names under the schema.
-   `get_table_and_columns(schema_name: str, table_name: str) -> Tuple[DataTable, List[DataColumn]]`: This is the main function which loads the table information and a list of its columns. See DataTable, DataColumn in base_metastore_loader.py to learn about the structure of data that needs to be returned.
-   `get_metastore_params_template() -> AllFormField`: return the input form that configures the metastore. Normally it should include connection string and associated authentication data.

And that is all! If the metastore is org specific, you can put it in the plugins directory, see [Plugins Guide](plugins.md) for more details.
