---
id: add_stats_logger
title: Stats Logging
sidebar_label: Stats Logging
---

Stats logging is used for monitoring and measuring the performance of an application or system. Querybook provides the support to collect metrics by adding your own stats logger, like StatsD. Here are the metrics we currently added:
  - Number of active users
  - Number of API requests
  - Latency of API requests
  - Number of websocket connections
  - Number of sql session failures
  - Number of scheduled system task failures
  - Number of scheduled datadoc failures
  - Latency of Redis operations
  - Number of query executions

## Configure Event Logger
Update `STATS_LOGGER_NAME` in the querybook config yaml file with the logger name you'd like to use.

```
STATS_LOGGER_NAME: ~
```

## Add a new Stats Logger as a plugin
If you'd like to actually use this feature, you need to create your own stats logger and add it as a [plugin](plugins.md).


1. Locate the plugin root directory for your customized Querybook, and find the folder called `stats_logger_plugin`.
2. Add your stats logger code similiar to the builtin loggers, like `ConsoleStatsLogger`, which means making sure it inherits from `BaseStatsLogger` and implements the abstract methods.
3. Add the new stats logger in the variable `ALL_PLUGIN_STATS_LOGGERS` under `stats_logger_plugin/__init__.py`
