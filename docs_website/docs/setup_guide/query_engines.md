---
id: query_engines
title: Query Engines
sidebar_label: Query Engines
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

Querybook only supports a few of the Tier 1 & 2 databases by default. When Querybook is launched, it checks with SqlAlchemy to see if any of the databases below are available. If so, the query engine would be automatically available to set up in the Admin UI.

## All Query Engines

**Note**: If the query engine is not included below, but it does have a Sqlalchemy integration, you can still use it in Querybook. Follow the [Connect to a Query Engine](./connect_to_a_query_engine) with 1 additional step before step 4. Visit `<project_root>/querybook/server/lib/query_executor/sqlalchemy.py` and add the query engine to the list variable `SQLALCHEMY_SUPPORTED_DIALECTS`, and continue to step 4. If it works, please contribute to Querybook by submitting a PR of your changes.

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
