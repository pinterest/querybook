---
id: connect_to_query_engines
title: Connect to Query Engines
sidebar_label: Connect to Query Engines
---

## Overview

Querybook supports all Sqlalchemy compatible query engines by default. Basic functionalities such as query execution, table metadata, and auto-completion are provided out of the box. However, more advanced integrations would require customized code. Overall, the query engines can be categorized into 3-tiers:

| Tier                            | Tier 3     | Tier 2            | Tier 1             |
| ------------------------------- | ---------- | ----------------- | ------------------ |
| Summary                         | Not tested | Tested w/ DB      | Used in Production |
| Library                         | Sqlalchemy | Custom/SqlAlchemy | Custom             |
| Run Queries                     | ✓          | ✓                 | ✓                  |
| Paginated Result Fetch          | ✓          | ✓                 | ✓                  |
| Syntax highlight & Autocomplete | ✓          | ✓                 | ✓                  |
| Query Progress                  | x          | ?                 | ✓                  |
| Query Logs                      | x          | ?                 | ✓                  |
| Query Metadata                  | x          | ?                 | ✓                  |
| Cancel Query                    | x          | ?                 | ✓                  |
| User Authentication             | x          | x                 | ✓                  |
| Syntax Error Parsing            | x          | ?                 | ✓                  |
| Service discovery               | x          | x                 | ✓                  |
| Language Specific Autocomplete  | x          | x                 | ✓                  |

Tier 1 does not mean engines can be used in production everywhere since different companies/org require different kinds of integrations. However, tier 1 databases provide an excellent foundation to extend additional functionalities. Use them as a reference or subclass them via the [query engine plugin](../integrations/add_query_engine.md).

If you have tried any of the tier 3 databases and confirmed it works, please update this doc to let others know.

## Query Engine Support

Querybook only supports a few of the Tier 1 & 2 databases by default. When Querybook is launched, it checks with SqlAlchemy to see if any of the databases below are available. If so, the query engine would be automatically available to set up in the Admin UI. Please see the [step by step guide](#step-by-step-guide) below to see an working example.

## Step by step guide

In this guide, we will go through adding Amazon Redshift query engine to Querybook. This serves as an example to adding all sqlalchemy-compatible query engines.

1. Clone and download the repo

```sh
git clone git@github.com:pinterest/querybook.git
cd querybook
```

2. Create a `local.txt` under `requirements/` folder in the project's root directory

```sh
touch requirements/local.txt
```

3. Add the required packages

```sh
echo -e "sqlalchemy-redshift\nredshift_connector" > requirements/local.txt
```

4. Start the container

```sh
make
```

5. Register as a new user and use the demo setup.
6. Visit [https://localhost:10001/admin/query_engine/](https://localhost:10001/admin/query_engine/) and create a new query engine. Put `redshift` as the language and `generic-sqlalchemy` as the executor. In the `Executor Params`, put the connection string (as specified by SqlAlchemy) in the `Connection_string` field.
7. Go to [https://localhost:10001/admin/environment/1/](https://localhost:10001/admin/environment/1/) and add the Redshift engine under the demo_environment.
8. Now you can run queries against the new Redshift engine in [https://localhost:10001/demo_environment/adhoc/](https://localhost:10001/demo_environment/adhoc/).
9. To include table metadata and autocompletion, you would need to add a metastore. Visit [https://localhost:10001/admin/metastore/](https://localhost:10001/admin/metastore/) and create a new metastore. Use SqlAlchemyMetastoreLoader with the exact connection string used for the query engine. Click on `Save` -> `CREATE SCHEDULE` -> `Create Task`. Now click on `Run Task` to sync. You can view the progress in the `History` tab. Wait until it is completed (Should be done in seconds if the number of tables is small).
10. Go to your query engine page on [https://localhost:10001/admin/query_engine/](https://localhost:10001/admin/query_engine/), in the Metastore field, choose the metastore you just created and click `Save`.
11. Visit [https://localhost:10001/demo_environment/adhoc/](https://localhost:10001/demo_environment/adhoc/) again and the auto complete feature should be available. You can also view all tables by clicking on the `Tables` button on the left sidebar and select the specific metastore.

## All Query Engines

**Note**: If the query engine is not included below, but it does have a Sqlalchemy integration, you can still use it in Querybook. Follow the [step by step guide](#step-by-step-guide) with 1 additional step before step 4. Visit `<project_root>/querybook/server/lib/query_executor/sqlalchemy.py` and add the query engine to the list variable `SQLALCHEMY_SUPPORTED_DIALECTS`, and continue to step 4. If it works, please contribute to Querybook by submitting a PR of your changes.

| Query Engine         | Tier | Package                                                                                                                                                                  |
| -------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Apache Drill         | 3    | [sqlalchemy-drill](https://pypi.org/project/sqlalchemy-drill/)                                                                                                           |
| Apache Hive          | 1    | [pyhive](https://pypi.org/project/PyHive/) OR `-r engines/hive.txt`                                                                                                      |
| Apache Kylin         | 3    | [kylinpy](https://pypi.org/project/kylinpy/)                                                                                                                             |
| Apache Solr          | 3    | [sqlalchemy-solr](https://pypi.org/project/sqlalchemy-solr/)                                                                                                             |
| Amazon Athena        | 3    | [pyathena](https://pypi.org/project/pyathena/)                                                                                                                           |
| Amazon Redshift      | 2    | [sqlalchemy-redshift](https://pypi.org/project/sqlalchemy-redshift/)<br/>[redshift_connector](https://pypi.org/project/redshift-connector/) OR `-r engines/redshift.txt` |
| BigQuery             | 2    | [google-cloud-bigquery](https://pypi.org/project/google-cloud-bigquery/)<br/> OR `-r engines/bigquery.txt`                                                               |
| ClickHouse           | 3    | [clickhouse-sqlalchemy](https://pypi.org/project/clickhouse-sqlalchemy/)<br/>[clickhouse-driver](https://pypi.org/project/clickhouse-driver/)                            |
| CockroachDB          | 3    | [sqlalchemy-cockroachdb](https://pypi.org/project/sqlalchemy-cockroachdb/)<br/>[psycopg2](https://pypi.org/project/psycopg2/)                                            |
| CrateDB              | 3    | [crate](https://pypi.org/project/crate/)                                                                                                                                 |
| Dremio               | 3    | [sqlalchemy-dremio](https://pypi.org/project/sqlalchemy-dremio/)                                                                                                         |
| Druid                | 2    | [pydruid](https://pypi.org/project/pydruid/) OR `-r engines/druid.txt`                                                                                                   |
| ElasticSearch        | 3    | [elasticsearch-dbapi](https://pypi.org/project/elasticsearch-dbapi/0.2.1/)                                                                                               |
| EXASolution          | 3    | [sqlalchemy-exasol](https://pypi.org/project/sqlalchemy-exasol/)                                                                                                         |
| Firebird             | 3    | [sqlalchemy-firebird](https://pypi.org/project/sqlalchemy-firebird/)                                                                                                     |
| Google Spreasheets   | 3    | [gsheetsdb](https://pypi.org/project/gsheetsdb/)                                                                                                                         |
| IBM DB2              | 3    | [ibm-db-sa](https://pypi.org/project/ibm-db-sa/)                                                                                                                         |
| Microsoft Access     | 3    | [sqlalchemy-access](https://pypi.org/project/sqlalchemy-access/)                                                                                                         |
| Microsoft SQL Server | 3    | Included by default                                                                                                                                                      |
| MySQL                | 1    | Included by default                                                                                                                                                      |
| MonetDB              | 3    | [sqlalchemy_monetdb](https://pypi.org/project/sqlalchemy_monetdb/)                                                                                                       |
| Oracle               | 3    | Included by default                                                                                                                                                      |
| PostgreSQL           | 2    | Included by default                                                                                                                                                      |
| Presto               | 1    | [pyhive](https://pypi.org/project/PyHive/) OR `-r engines/presto.txt`                                                                                                    |
| SAP Hana             | 3    | [sqlalchemy-hana](https://pypi.org/project/sqlalchemy-hana/0.2.2/)                                                                                                       |
| Snowflake            | 2    | [snowflake-sqlalchemy](https://pypi.org/project/snowflake-sqlalchemy/) OR `-r engines/snowflake.txt`                                                                     |
| SQLite               | 2    | Included by default                                                                                                                                                      |
| Teradata Vantage     | 3    | [teradatasqlalchemy](https://pypi.org/project/teradatasqlalchemy/)                                                                                                       |
| Trino                | 2    | [trino](https://github.com/trinodb/trino-python-client) OR `-r engines/trino.txt`                                                                                        |
| Vertica              | 3    | [sqlalchemy-vertica-python](https://pypi.org/project/sqlalchemy-vertica-python/)                                                                                         |
