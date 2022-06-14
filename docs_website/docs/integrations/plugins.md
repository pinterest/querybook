---
id: plugins
title: Plugins
sidebar_label: Plugins
---

## Overview

Plugins provide a simple way for admins to add their org specific code to Querybook without modifying the open sourced code. This guide will cover all the plugins that can be added as well as the required steps needed to install plugins on Querybook.

## Types of plugins

In this section we will cover different types of plugins and their use cases.

### Query Engine Plugin

Query engine plugin is useful if you want to add custom query engines that are not supported in Querybook or add different behaviors in the default query engines.

If you are adding a new custom query engine, please check the [Add Query Engine guide](./add_query_engine.md) in the integrations guide to learn how to add a query engine.

If you are extending the default query engine, you can create a new engine executor that inherits from the current query engines and override any behavior it has.

### Auth Plugin

Auth plugin can be used to add different authentication methods to Querybook as well as adding custom behavior behaviors after a user authenticates. An example of the latter case is to automatically add users to different environments based on additional user permission queries. Please check [Add Auth guide](./add_auth.md) to learn how to add a new auth plugin.

### Engine Status Checker

Engine status checker plugin lets you customize how you want to expose the backend query engine information to the frontend user. Place your custom logic under engine_status_checker_plugin/. Please check [Add Engine Status Checker guide](./add_engine_status_checker.md) to learn how to add a new engine status checker.

### Exporter Plugin

Exporters are ways to provide a quick way for user to move their query results to external websites. Querybook by default provides "python exporter" and "r exporter" code but they need to included in the plugin exporter to be used. Please check [Add Exporter guide](./add_exporter.md) to learn how to add a new exporter and different types of exporters.

### Notifier Plugin

Notifiers are used to give users various messages for completion of their query actions. Querybook by default provides "email_notifier" and "slack_notifier" code. Please Check [Add Notifier guide](./add_notifier.md) to learn how to add a new notifier.

### Job Plugin

Admins can use job plugin to add new job schedules to Querybook. Querybook provides various types of jobs such as retention jobs but they are unscheduled unless it is included in job plugin. You can also use job plugin to schedule tasks from task plugin. Please check [Add Custom Jobs guide](./add_custom_jobs.md) to see the formatting required.

### Metastore Plugin

Similar to Query engine, metastore plugins provides a way for admins to configure how a metastore can be populated. Users can use it add new ways to load table information. Please check [Add Metastore guide](./add_metastore.md) to learn how to add a new metastore loader.

### Result Store Plugin

By default, querybook supports storing query results/logs to and from s3 and sqlalchemy database. If other store is needed (such as local file system or google cloud), you can add a custom result store exporter. Please check [Add Result Store guide](./add_result_store.md) for more details.

### Task Plugin

Task plugin lets you implement custom async tasks on querybook. For example, you can add a task which refreshes user's profile pic from an external source or add a task that checks if a user still has their access to an environment.

### Web Page Plugin

Web page plugin allows you to inject custom js, css to Querybook. Place your custom logic under webpage_plugin/custom_script.ts to inject it into the Querybook webapp.

### Lineage plugin

Lineage plugin allows you to extend Querybook to fetch lineage information from a custom data lineage backend. Please check [Add Lineage guide](./add_lineage.md) for more details.

### DAG Exporter Plugin (Experimental)

DAG Exporters allow users to create a workflow from Query Cells in DataDocs. Querybook by default provides "demo_dag_exporter" code as an example but it needs to included in the plugin exporter to be used and does not work out of the box. Please Check [Add DAG Exporter guide](./add_dag_exporter.md) to learn how to add a dag exporter.

## Installing Plugins

1. Ensure you can run the vanilla Querybook

Please ensure you can spin up Querybook's production docker images (webserver, scheduler, workers) and able to set customized settings. Check [Infra Config](../configurations/infra_config.md) for more details.

1. Setup a new project folder for Querybook plugins. This should be outside of Querybook's repo.

Querybook can be pulled from dockerhub directly, so this is mainly used for plugins and custom environment settings.

3. To get started. Copy plugins folder from the Querybook repo.

```sh
cp -R ../querybook/plugins .
```

Copy the `plugins` folder from the root directory of this project to the custom project folder.

4. Extending the docker image and install dependencies

Create a new dockerfile which can be used to install additional libraries and dependencies. Make sure to also COPY the plugins folder into the docker image.

```Dockerfile
FROM .../querybook:latest

# If you need to install additional libs
RUN rm -rf /var/lib/apt/lists/* \
    && apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install --no-install-recommends -y \
    ... \
    ... \
    ... \
    && apt-get clean

# If you need to install additional python packages
COPY plugins/requirements /opt/plugins/requirements
RUN pip install -r /opt/plugins/requirements/base.txt

# Copy the plugins directory
COPY plugins /opt/plugins
```

5. Pack the plugins with the new docker image

Last but not least, remember to set docker environment variable QUERYBOOK_PLUGIN to the path of the plugins folder and also include it as part of the PYTHONPATH.

```Dockerfile
ENV QUERYBOOK_PLUGIN=/opt/plugins
ENV PYTHONPATH=/opt/querybook/querybook/server:/opt/plugins
```
