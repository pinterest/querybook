---
id: breaking_changes
title: Breaking Changes
sidebar_label: Breaking Changes
slug: /changelog
---

Here are the list of breaking changes that you should be aware of when updating Querybook:

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
