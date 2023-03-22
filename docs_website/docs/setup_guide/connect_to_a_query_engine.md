---
id: connect_to_a_query_engine
title: Connect to a Query Engine
sidebar_label: Connect to a Query Engine
---

## Prerequisites

-   Have the Querybook repository cloned. See [Quick Setup](./quick_setup.md).
-   Have a PostgreSQL database ready to connect. It could be either on your localhost or on a remote server.

## General Process

1. Create a query engine for query execution.
2. Add the query engine to an environment. Create one first if needed.
3. **[Optional but highly recommended]** Create a new metastore to associate with the query engine.

:::info
If you dont have an idea of above concepts of **query engine**, **environment** and **metastore**, please refer to [here](../configurations/general_config#environment)
:::

## Step by Step

Here we'll guide you through the process of adding a query engine for **PostgreSQL** as an example.

1. Create a `local.txt` file under the `requirements/` folder in the project's root directory.

```bash
touch requirements/local.txt
```

2. Check the [engine list](https://www.querybook.org/docs/setup_guide/connect_to_query_engines#all-query-engines) and find the package it depends on.
3. If the required package is not included by default, add it to the `local.txt` file. For `PostgreSQL`, no additional package is needed. Here is an example for `Amazon Redshift`:

```bash
echo -e "sqlalchemy-redshift\nredshift_connector" > requirements/local.txt
```

4. Start the container:

```bash
make
```

5. Open [http://localhost:10001](http://localhost:10001)
6. Sign up as a new user and use the demo setup. The first signed up user will be added as the admin.
7. Open the admin tool [http://localhost:10001/admin](http://localhost:10001/admin)
8. Click `Query Engine` to add a new query engine

    - Provide a name for the query engine.
    - Select `Postgresql` as the language.
    - Select `sqlalchemy` as the executor.
    - Input the connection string, which should look like
        ```
        postgresql://<username>:<password>@<server-host>:<port>/<database>
        ```
        Please refer to the SqlAlchemy [documentation](https://docs.sqlalchemy.org/en/20/core/engines.html#postgresql) for the connection string format.
    - Select `SelectOneChecker` as the status checker

    :::caution About localhost

    If Querybook and PostgresSQL are both running on the same machine, you'll need some extra change.

    **Mac**

    Please use `host.docker.internal` instead of `localhost` as the server address. e.g. `postgresql://<username>:<password>@host.docker.internal:5432/<database>`

    **Linux**

    Before step 4 `make`

    - update `docker-compose.yml` to add `network_mode=host` for below services
        - web
        - worker
        - scheduler
    - update `containers/bundled_querybook_config.yaml` to use `localhost` instead of service names

    ```yaml
    DATABASE_CONN: mysql+pymysql://test:passw0rd@localhost:3306/querybook2?charset=utf8mb4
    REDIS_URL: redis://localhost:6379/0
    ELASTICSEARCH_HOST: localhost:9200
    ```

    Then keep using `localhost` as the server host in the connection string
    :::

9. Click `Test Connection` to see if it can connect to the database correctly. If it fails, go back and check the settings above and ensure that the database server is ready for connection. You can use command-line tools like `psql` to try to connect with the same connection settings.
10. Click `Save` to create the engine.
11. Go to the `Environment` tab and select `demo_environment`. You can also create a new environment if you like.
12. For `Query Engines`, select `postgresql` from the dropdown list, and click `Add Query Engine`.
13. Open [http://localhost:10001/demo_environment/adhoc/](http://localhost:10001/demo_environment/adhoc/). Switch to the new environment if you created a new one in step 11.
14. Try to write a test query, select `postgresql`, and run it.

**That's it 🎉. Keep reading if you'd like to know how to add a metastore.**

15. Open [http://localhost:10001/admin/metastore/](http://localhost:10001/admin/metastore/)
16. Create a new metastore.
    -   Provide a name for the metastore.
    -   Select `SqlAlchemyMetastoreLoader` as the loader.
    -   Input the same connection string as the query engine.
        :::info Connection String
        For PostgreSQL, the metastore is the same as the database, so we're using the same connection string for both the metastore and query engine. However, this may not be the case for other engines, such as Hive Metastore + Presto.
        :::
17. Click `Create` to create the metastore.
18. On the same page, you will see a section called `Update Schedule`. Click the button `Create Task`. This scheduled task is used for syncing the metadata from the metastore to Querybook periodically.
19. Click `Run Task` and wait until it completes.
20. Go to the `Query Engine` tab and select the new query engine `postgresql`.
21. Select `postgres_metastore` from the dropdown list for the `Metastore` field and click `Save`.
22. Go to the `Tables` tab on page [http://localhost:10001/demo_environment/](http://localhost:10001/admin/metastore/). Select `postgres_metastore` from the dropdown list. You'll see the tables synced from the metastore. If you don't see any tables, go back to step 17 and check if the connection string is correct.

Congratulations! You have successfully set up Querybook with a query engine and a metastore. You can now start exploring and analyzing your data with ease.
