---
id: add_event_logger
title: Event Logging
sidebar_label: Event Logging
---

:::warning
This is an experimental feature. You can use the plugins for customization but they may break in future updates.
:::

Querybook provides the instrumentation support of logging client action events, as well as API events. With event logs, we can analyze user behavior on Querybook and gauge interactions with some specific features, e.g.
  - Number of times a user has interacted with the feature of query formatting
  - Which result gets clicked for a table search string
  - How many times the home page gets viewed and clicked
  - ...

## Event Log
An event log contains:
 - created_at (datetime): timestamp of when the event occurred
 - uid (int): id of the user who performed the action
 - event_type (EventType): action type like view, click an ui element
 - event_data (dict): json to provide addtional info about the action.

## Event Type
We may add more event types in the future. Here are what have been supported right now:
  - API: an api request
  - VIEW:  a UI element gets viewed
  - CLICK: a UI element gets clicked

## Configure Event Logger
Update `EVENT_LOGGER_NAME` in the querybook config yaml file with the logger name you'd like to use. See below for the available loggers.

```
# --------------- Logging ---------------
EVENT_LOGGER_NAME: ~
```

## Builtin Event Loggers

### NullEventLoger (name: null)
This is the default logger, which does nothing and disregards the logs.

### ConsoleEventLoger (name: console)
This will print the event logs to the console. Could be used for debugging purpose.

### DBEventLoger (name: db)
This will save the event logs to the table **event_logs** in querybook mysql db.

By default, the logs are kept forever. If you have scheduled the task `run_all_db_clean_up_jobs`, logs will be kept for 7 days. To change the default retention of 7 days, you can update the setting of `days_to_keep_event_logs` in the scheduled task `run_all_db_clean_up_jobs` from the admin tool.


## Adding a new Event Logger as a plugin
If you'd like to save the logs to another place, you can add it as a [plugin](plugins.md).


1. Locate the plugin root directory for your customized Querybook, and find the folder called `event_logger_plugin`.
2. Add your event logger code similiar to the builtin loggers, which means making sure it inherits from `BaseEventLogger` and implements the methods `logger_name()` and `log()`.
3. Add the new event logger in the variable `ALL_PLUGIN_EVENT_LOGGERS` under `event_logger_plugin/__init__.py`
