---
id: breaking_changes
title: Breaking Changes
sidebar_label: Breaking Changes
slug: /changelog
---

Here are the list of breaking changes that you should be aware of when updating Querybook:

## v3.6.0

Added a new search index for list search (or boards search internally). Follow the instructions at [Re-Initialize ElasticSearch](../developer_guide/reinitialize_es.md) to recreate ElasticSearch indices.

## v3.5.0

The ElasticSearch index mappings for `query_cells` and `query_executions` were updated to include fields to restrict access to queries based on datadoc access permissions. Query cells and executions on private datadocs will only be shown in query search to users that have access to these datadocs.

Follow the instructions at [Re-Initialize ElasticSearch](../developer_guide/reinitialize_es.md) to recreate ElasticSearch indices.

Alternatively, you can run the script `querybook/server/scripts/es_3_5_0_upgrade.py` to update only the added fields in the query indices.

## v3.4.0

There is a new field `feature_params` added to the `query_engine` table to replace `status_checker`.
Please run [db migrations](../developer_guide/run_db_migration.md) for query engines to continue to work.

`_perform_check` in EngineStatusChecker is now deprecated. Override `perform_check_with_executor` for custom
health check logic.

## v3.2.0

Exporters can now export all rows of statement result (limited to the size of the exporter).
`lib.export.exporters.gspread_exporter` was updated to support exporting all rows (up to google
spreadsheets limits).

-   Breaking changes:
    -   custom exporter plugins will need to be updated to ensure exporter file/csv size limits are not exceeded and should be updated to use `_get_statement_execution_result_iter` to export full
        csv result
    -   `_get_statement_execution_result` in `lib.export.base_exporter.BaseExporter` will be deprecated
        since exporters will now use `_get_statement_execution_result_iter` to export entire statement
        results
    -   `get_csv_iter` is a new abstract method of `lib.result_store.stores.BaseReader`, and needs to be implemented by any classes inheriting from this

## v3.1.2

Generic OAuth flow now works with HOT-RELOAD activated (development mode).

## v3.1.1

Generic OAuth flow now works with the retrieved access_token in its 'Authorization Bearer' header parameter by default.

## v3.1.0

Query cells and query executions are now added as new indices in ElasticSearch.

Depending on your deployment of ElasticSearch, you might need to manually re-initialize the ElasticSearch to create the new query indices and bulk insert existing query cells & executions.

Follow the instructions at [Re-Initialize ElasticSearch](../developer_guide/reinitialize_es.md) to ensure that ElasticSearch will be re-initialized in your deployment.

## v3.0.0

### All optional Python dependencies are removed

:::info
If you use the public docker image on https://hub.docker.com/r/querybook/querybook, no action is required.
:::

To ensure the build time is scalable with the increasing amount of custom integrations, optional
python packages such as pyhive (for Hive, Presto support) and oauth are removed from the default installation.

The following integrations will now require custom installation:

-   Query Engine:
    -   BigQuery (google-cloud-bigquery)
    -   Druid (pydruid)
    -   Hive (pyhive)
    -   Presto (pyhive)
    -   Snowflake (snowflake-sqlalchemy)
    -   Trino (trino)
-   Metastore:
    -   Hive Metastore (w/ Thrift) (hmsclient)
    -   Glue (boto)
-   Authentication:
    -   OAuth (requests-oauthlib)
    -   LDAP (python-ldap)
-   Exporter:
    -   GSpread exporter (gspread)
-   Result Store:
    -   AWS S3 (boto3)
    -   Google GCS (google-cloud-storage)
-   Elasticsearch:
    -   AWS Based (requests-aws4auth)

Even though these packages are removed from the default installation, these dependencies are
quite easy to add back! Checkout the [Infra Installation Guide](../configurations/infra_installation.md) to learn how.

### ElasticSearch

Depending on deployment of Querybook, re-initialization of indices in ElasticSearch 7 cluster might be needed. Follow the instructions in [Re-Initialize ElasticSearch](../developer_guide/reinitialize_es.md).

#### Make and Docker-compose

In case some inconsistency occurs in ES indices source data in development deployment using `make`,
or deployment using `docker-compose`, one can clear cached ES data by stopping and removing `querybook_elasticsearch_1` container
and then removing Docker volume `querybook_esdata1`. Next `make` or `docker-compose` will create fresh volume again.

#### Kubernetes

Kubernetes base deployments that uses ElasticSearch templates as they are should work without any impact,
as the volumes are always recreated with deployment of a new (updated) pod.

## v2.9.0

Now announcements have two extra fields - `active_from` and `active_till`. These fields are not required and a user can still create an announcement without these two fields and if an announcement has two one these fields and the date in these fields are not in the range, this announcement will be filtered.

## v2.8.0

Result store plugin change. Now BaseReader::get_download_url requires a custom_name field to rename the download file. You only need to add the `custom_name=None` in the parameters for it to work.
