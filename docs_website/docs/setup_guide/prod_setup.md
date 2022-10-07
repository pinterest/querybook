---
id: prod_setup
title: Production Setup
sidebar_label: Production Setup
---

Once further scalability is desired you can start each service individually in different machines, so you can scale them independently as needed.

#### Step 1: Choose and Build Docker image

The [public docker image](https://hub.docker.com/r/querybook/querybook) provided only contains a subset of all integrations possible with Querybook.
To intergrate with your tech stack, please check the [Infra Installations Guide](../configurations/infra_installation.md) and [Query Engines Guide](./connect_to_query_engines.md)
to see how to install and use different integrations such as Presto, OAuth, AWS and more.

#### Step 2: Setup Infrastructure

These items should be prepared before setting up Querybook:

-   (**Required**) A MySQL/PostgresSQL[^1] database with version >=5.7. It is recommended to have more than 5GB of space.
-   (**Required**) An Elasticsearch server with version 7.
-   (**Required**) A 2GB Redis instance, Querybook should not use more than 1GB of memory.
-   If OAuth will be used for authentication, remember to get the OAuth client information (secrets, token url, etc).
-   For notifications, you would need
    -   Slack: Slack API Token
    -   Email: An email address andthe email server running on port 25 of the web server.

#### Step 3: Choose the instances

You will need to deploy 3 different services for Querybook. The web servers handle the HTTP/WebSocket traffic, the workers handle the async tasks such as running the query, and the scheduler sends scheduled tasks to the workers. Since the scheduler doesn't do much, it is recommended to use the smallest instance possible. On the other hand, we recommend having as few workers as possible, so choose the CPU with the maximum number of threads. The amount of memory a worker needs depends on the number of celery processes and the query engines your org uses. For example, Presto would consume a lot of memory because all the query results are returned at once whereas Hive would consume a lot less with chunk loading.

Last but not least, please make sure to only have 1 instance of scheduler running to prevent duplication in scheduled tasks and have at least 2 workers for rolling restart deployments.

#### Step 4: Update your environment variables configuration

See the [Infra Config](../configurations/infra_config.md) section for this.

#### Step 5: Start each service

You can start each service by the following commands:

-   Webserver: `make web`
-   Celery worker: `make worker`
-   Scheduler: `make scheduler`

If you add `prod_` in front of the service name (for example `make prod_web`), it will start the production version which uses the prod docker image, which has less logging, no auto-reloading, and utilizes uwsgi to handle more requests.

## Post Setup Configuration

1. Initialize your database and elasticsearch by running the following script inside the Querybook docker container:

```sh
docker run -it querybook bash  # or if it is already running: docker exec -it querybook_web bash
/opt/querybook/scripts/init_db
```

2. By default the first user of Querybook is given the admin permission. Navigate to `/admin/` which contains the admin tools.
3. Select the "environment" tab and create an environment. All query engines and datadocs in Querybook need to belong to an environment.
4. If you use hive metastore, go to metastore page and configure a metastore. A daily job is auto created to ensure it gets updated daily at utc 0. You can adjust the frequency or manually kickoff a run.

    Note that hivemetastore is not required for a query engine to function.

5. Create a query engine and now Querybook should be ready to use.

Check out the [general configuration guide](../configurations/general_config.md) for more detailed info about querybook configuration.

[^1]: To use PostgresSQL, you need to install the [psycopg2 driver](https://pypi.org/project/psycopg2/) via pip.
