---
id: infra_installation
title: Infra Installation
sidebar_label: Infra Installation
---

By default, the Querybook image build only includes the core packages that ensure it can run.

To add more integrations such as query engines, metastores, or authentications, you would need to
install the Python packages yourself.

Querybook comes with a set of integrations that can be auto included once the Python packages are installed.
It also supports [plugins](../integrations/plugins.md) for you to add additional integrations that are not yet included.

## Out-of-box support

Here are all supported integrations included by default:

-   Query Engines:
    -   Firebird
    -   Mysql
    -   Sqlite
    -   Postgresql
    -   Oracle
    -   Mssql
-   Metastore:
    -   MysqlMetastore
    -   SqlalchemyMetastore
-   Authentication:
    -   Username/Password
-   Exporter:
    -   python exporter
-   Result Store (Persisting query result):
    -   db
    -   file
-   Elasticsearch:
    -   custom hosted

## Integrations that can be supported via package install

:::info
The public docker image includes all of the custom dependencies listed below.

You can also include all subdependencies by adding `-r extra.txt` in `requirements/local.txt` or putting `EXTRA_PIP_INSTALLS=extra.txt` in docker build args.
:::

If you install the required packages, these integrations will be automatically supported:

-   Query Engines:
    -   BigQuery (via `-r engine/bigquery.txt`)
    -   Druid (via `-r engine/druid.txt`)
    -   Hive (via `-r engine/hive.txt`)
    -   Presto (via `-r engine/presto.txt`)
    -   Redshift (via `-r engine/redshift.txt`)
    -   Snowflake (via `-r engine/snowflake.txt`)
    -   Trino (via `-r engine/trino.txt`)
    -   And [any sqlalchemy supported engines](../setup_guide/connect_to_query_engines.md)
-   Metastore:
    -   Hive Metastore (via `-r metastore/hms.txt`)
    -   Hive Metastore with Thrift (install Hive Metastore and Hive)
    -   Glue (via `-r metastore/glue.txt`)
-   Authentication:
    -   Install `-r auth/oauth.txt` to use the following:
        -   Azure oauth
        -   Github oauth
        -   Google oauth
        -   Okta oauth
        -   Generic oauth
    -   LDAP (via `-r auth/ldap.txt`)
-   Exporter:
    -   Google Sheet Exporter (via `-r exporter/gspread.txt`)
-   (Experimental) Table Upload:
    -   Parquet (via `-r exporter/parquet.txt`)
-   Result Store:
    -   AWS S3 (via `-r platform/aws.txt`)
    -   Google GCS (via `-r platform/gcp.txt`)
-   Elasticsearch:
    -   AWS hosted (via `-r platform/aws.txt`)
-   Parsing (transpilation):
    -   SQLGlot (via `-r parser/sqlglot.txt`)

## How to install packages for integration

There are two ways to install addition python packages in Querybook:

1. Install via requirements/local.txt.
2. Install by extending the prod image.

We will go over a simple example that installs Presto and OAuth for Querybook.

### Install via requirements/local.txt

Create a `local.txt` under `requirements/` folder in the Querybook project's root directory

```sh
touch requirements/local.txt
```

Add the follow lines to local.txt

```
-r engine/presto.txt
-r engine/oauth.txt
```

:::info
Check out `requirements/engine/presto.txt` to see what python packages are installed to enable Presto support.
:::

Alternatively, you can supply a different package version base on your need:

```
PyHive[presto]==0.6.3
requests-oauthlib==1.0.0
```

Now you can build the docker image and publish it to dockerhub or aws ecr.

```sh
make dev_image  # for dev
make prod_image  # for prod
docker tag ...
docker push ...
```

### Install by extending the prod image

This part is very similar to [plugin installation](../integrations/plugins.md#installing-plugins). Follow the steps to create a custom repo.
Now add the requirements file somewhere, in this example we will put the requirements file called 'custom_deps.txt' at the plugins project root.
In the requirements file, put the following:

```
-r engine/presto.txt
-r engine/oauth.txt
```

As mentioned in the previous example, you can also reference the packages such as `pyhive` directly.

Add the following steps in the Dockerfile of the plugins project:

```Dockerfile
COPY custom_deps.txt /opt/querybook/requirements/custom_deps.txt
RUN pip install -r /opt/querybook/requirements/custom_deps.txt
```

## Additional integrations

If you need to integrate with anything that is not listed above, please refer to the [plugins guide](../integrations/plugins.md) to learn how to add them.
