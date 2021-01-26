# Querybook

![Build Status](https://github.com/pinterest/querybook/workflows/Tests/badge.svg)
[![License](http://img.shields.io/:license-Apache%202-blue.svg)](http://www.apache.org/licenses/LICENSE-2.0.txt)

Querybook is a Big Data IDE that allows you to discover, create, and share data analyses, queries, and tables.
[Check out the full documentation & feature highlights here.](https://querybook.org)

# Features

-   📚 Organize **analyses** with rich text, queries, and charts
-   ✏️ Compose queries with **autocompletion** and hovering tooltip
-   📈 Use scheduling + charting in DataDocs to build **dashboards**
-   🙌 Live query **collaborations** with others
-   📝 Add additional **documentation** to your tables
-   🧮 Get lineage, sample queries, frequent user, search ranking based on **past query runs**

# Getting started

## Prerequisite

Please install Docker before trying out Querybook.

## Quick setup

Pull this repo and run `make`. Visit https://localhost:10001 when the build completes.

For more details on installation, [click here](docs_website/docs/setup_guide/overview.md)

## Configuration

For infrastructure configuration, [click here](docs_website/docs/configurations/infra_config.md)
For general configuration, [click here](docs_website/docs/configurations/general_config.md)

## Supported Integrations

### Query Engines

-   Presto
-   Hive
-   Druid
-   Snowflake
-   Big Query
-   MySQL
-   Sqlite
-   PostgreSQL
-   SQL Server
-   Oracle

### Authentication

-   User/Password
-   OAuth
    -   Google Cloud OAuth
-   LDAP

### Metastore

Can be used to fetch schema and table information for metadata enrichment.

-   Hive Metastore
-   Sqlalchemy

### Result Storage

Use one of the following to store query results.

-   Database (MySQL, Postgres, etc)
-   S3
-   Google Cloud Storage
-   Local file

### Result Export

Upload query results from Querybook to other tools for further analyses.

-   Google Sheets Export
-   Python export

### Notification

Get notified upon completion of queries and DataDoc invitations via IM or email.

-   Email
-   Slack

# User Interface

Query Editor
![](./docs_website/static/img/key_features/editor.gif)

Charting
![](./docs_website/static/img/key_features/visualization.gif)

Scheduling
![](./docs_website/static/img/key_features/scheduling.png)

Lineage & Analytics
![](./docs_website/static/img/key_features/analytics.gif)

# Contributing Back

See [CONTRIBUTING](CONTRIBUTING.md).
