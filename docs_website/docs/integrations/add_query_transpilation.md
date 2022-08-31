---
id: add_query_transpilation
title: Add Query Transpilation
sidebar_label: Query Transpilation
---

:::warning
This is an experimental feature. You can use the plugins for customization but they may break in future updates.
:::

## Overview

Query transpilation allows you to convert between query from one language to another. The actual behavior would vary depending on the choice of transpiler provided.

## Provided Query Transpilators

Querybook is shipped with SQLGlot transpiler, you can check how it is implemented here: https://github.com/tobymao/sqlglot.

To use it, you would need to install the `sqlglot` package. Checkout the [infra installation guide](../configurations/infra_config.md) to see how.

## Plugins

You can provide custom query transpilers by defining `ALL_PLUGIN_QUERY_TRANSPILERS` under `query_transpilation_plugin`. To learn how to use plugins, checkout the [plugin guide](plugins.md).
Note that the custom query transpilers must inherit `BaseQueryTranspiler` which lives in `querybook/server/lib/query_analysis/transpilation/base_query_transpiler.py`.

## How to use

Once you provide `ALL_PLUGIN_QUERY_TRANSPILERS`, the set up is complete and the users can use it right away. The options for query transpilation depend on the transpilers being provided as well
as the available query engines in the environment. Users can find the transpiler choices under the ellipses dropdown which is located on the top right of the query cell and on the top left of
the adhoc query editor.
