---
id: add_engine_status_checker
title: Engine Status Checker
sidebar_label: Engine Checker
---

## What is it?

Engine checker allows users to see the health of backend query engines on Querybook UI. By default three checkers are provided:

1. SelectOneChecker: sends a `select 1` query to the engine every minute and checks if the correct value is returned.
2. ConnectionChecker: tries to create a cursor connection with the engine (basically select 1 but doesn't issue the query)
3. NullChecker: returns null always (this is the default)

You can choose which checker to use for every engine in admin tools query engine section.

## Adding custom engine checker

You can provide a custom engine status checker to in case you want to customize the check behavior or provide additional information.
Create the engine checker under the folder <project_root>/querybook/server/lib/engine_status_checker/. All engine status checker must inherit BaseEngineStatusChecker from <project_root>/querybook/server/lib/engine_status_checker/base_checker.py.

By default BaseEngineStatusChecker assumes you will use celery to check the engine status every minute in the backend celery worker. Each checked result will be cached in a sql table and served using the cache first approach. It further assumes that all users see the exact same status even if they are consuming different amount of resources. If these assumptions are true, the only method you need override is the `perform_check_with_executor` method which actually does the check. If you want to customize the fine grained behavior of the status checker, you can override any methods in BaseEngineStatusChecker to achieve it.

If the checker use case is org specific. You can use plugins (See this [Plugin Guide](plugins.md) to learn how to setup plugins for Querybook).

Once plugins folder is setup, import the engine checker class under `ALL_PLUGIN_ENGINE_STATUS_CHECKERS` in engine_status_checker_plugin/**init**.py .
