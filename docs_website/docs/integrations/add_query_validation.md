---
id: add_query_validation
title: Add Query Validation
sidebar_label: Query Validation
---

:::warning
This is an experimental feature. You can use the plugins for customization but they may break in future updates.
:::

## Overview

Query validation is provided in Adhoc query and DataDoc query cells. It is done by sending the entire query every 2 seconds (debounced) after user edit.

There are 2 cases where validation will be skipped:

1. If the query is empty.
2. If the query contains any templating, like `{{` or `{%`.

The query validator would return an array of errors and warnings. They are shown on the line number gutter, inside the editor, and also on the run button.

## Provided Query Validators

Currently, Querybook provides the Presto/TrinoExplainValidator.

### PrestoExplainValidator

The validator runs by transforming the query into `EXPLAIN (TYPE VALIDATE)` query. It then sends the query to the original engine to check if there is any semantic errors.

## Plugins

You can provide custom query validators by defining `ALL_PLUGIN_QUERY_VALIDATORS_BY_NAME` under `query_validation_plugin`. To learn how to use plugins, checkout the [plugin guide](plugins.md).
Note that the custom query validators must inherit `BaseQueryValidator` which lives in `querybook/server/lib/query_analysis/validation/base_query_validator.py`.

## How to use

First make sure the query validator you want to use is configured either thru plugins or provided by default. Note each validator only works for a single language.
For example, you cannot use PrestoExplainValidator for MySQL as it would error automatically.

To configure a query validator to a query engine, go to the admin query engine page and scroll to `Additional Features`. Select the validator you want to use under `Query Validator` and hit save.
Now refresh the page and the validation will be turned on.
