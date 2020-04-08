---
id: infra_config
title: Infra Config
sidebar_label: Infra Config
---

## Overview

<b>THIS GUIDE IS ONLY FOR INFRASTRUCTURE SETUP, PLEASE READ [GENERAL CONFIG](../admin_guide/general_config.md) FOR GENERIC CONFIGS</b>

Eventhrough DataHub can be launched without any configuration, it is absolutely required for more powerful infrastructure/flexible customization. In this guide we will walkthrough different kind of environment settings you can set for DataHub. You can see an example of the environment file in this repo by checking out `.env.example`.

When launching the DataHub docker, docker-compose will auto pick up all the relevant environment variables and add them DataHub's docker environment.

## Infrastructure

### Database

`DATABASE_CONN` (**required**): A sqlalchemy connection string to the database. Please check here https://docs.sqlalchemy.org/en/13/core/engines.html for formatting.

`DATABASE_POOL_SIZE` (optional, defaults to _10_): The size of the connection pool. See https://docs.sqlalchemy.org/en/13/core/pooling.html#sqlalchemy.pool.QueuePool.params.pool_size for more details.
`DATABASE_POOL_RECYCLE` (optional, defaults to _3600_): Number of seconds until database connection in pool gets recycled. See https://docs.sqlalchemy.org/en/13/core/pooling.html#setting-pool-recycle for more details.

### Redis

`REDIS_URL` (**required**): Connection string required to connect the redis instance. See https://www.digitalocean.com/community/cheatsheets/how-to-connect-to-a-redis-database for more details.

### ElasticSearch

`ELASTICSEARCH_HOST` (**required**): Connection string to elasticsearch host.
`ELASTICSEARCH_CONNECTION_TYPE` (optional, defaults to _naive_): Setting this to `naive` will connect to elasticsearch as is. If set to `aws`, it will use boto3 to get auth and then connect to elasticsearch.

### Query Result Store

`RESULT_STORE_TYPE` (optional, defaults to **db**): This configures where the query results/logs will be stored.

    - db: This will keep the query results in the default db set by DATABASE_CONN
    - s3: This will upload the query results on AWS S3

The following settings are only relevant if you are using `db`, note that all units are in bytes::

`DB_MAX_UPLOAD_SIZE` (optional, defaults to **5242880**): The max size of the result that can be retained, any row that exceeds the size limit will be truncated.

The following settings are only relevant if you are using `s3`, note that all units are in bytes:

`S3_BUCKET_NAME` (optional): S3 Bucket name
`S3_PATH_PREFIX` (optional, defaults to **''**): S3 key prefix for DataHub's stored results/logs
`S3_MIN_UPLOAD_CHUNK_SIZE` (optional, defaults to **10485760**): The chunk size when uploading to S3
`S3_MAX_UPLOAD_CHUNK_NUM` (optional, defaults to **10000**): The number of chunks that can be uploaded to S3, you can determine the maximum upload size by multiplying this with chunk size.
`S3_READ_SIZE` (optional, defaults to 131072): The size of chunk when reading from s3.
`S3_MAX_READ_SIZE` (optional, defaults to 5242880): The max size of s3 file DataHub will read for users to view.

### Logging

`LOG_LOCATION` (optional): By default server logs goes to stderr. Supply a log path if you want the log to appear in a file.

## Authentication

`AUTH_BACKEND` (optional, defaults to **app.auth.password_auth**): Python path to the authentication file. By default DataHub provides:

    - app.auth.password_auth: Username/password based on registering on DataHub.
    - app.auth.oauth_auth: Oauth based authentication.

You can also supply any custom authentication added in the auth plugin. See "Add Auth" and "Plugins" guide for more details.

the next few configurations are only relevant if you are using OAuth based authentication:

`OAUTH_CALLBACK_HOST` (optional): The web url to DataHub host after successful oauth authentication. If not provided, `PUBLIC_URL` will be used (See communication section for PUBLIC_URL).
`OAUTH_CLIENT_ID`(**required**)
`OAUTH_CLIENT_SECRET` (**required**)
`OAUTH_AUTHORIZATION_URL` (**required**): Url for oauth redirection
`OAUTH_TOKEN_URL` (**required**): Url to get the oauth token
`OAUTH_USER_PROFILE` (**required**): Url to get the user profile

## Communication

By default DataHub supports email and slack notifications for sharing DataDocs and Query completions.

`PUBLIC_URL` (optional, defaults to localhost): The public url to access DataHub's website, used in oauth, email and slack.

### Slack

`DATAHUB_SLACK_TOKEN` (**optional**): Put the Bot User OAuth Access Token from slack here. See https://api.slack.com/docs/oauth#bots for more details.

### Email

EMAILER_CONN (optional, defaults to localhost:22): Location of the emailer server
DATAHUB_EMAIL_ADDRESS (optional, required for email): Origin address when sending emails
