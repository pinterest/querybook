---
id: infra_config
title: Infra Config
sidebar_label: Infra Config
---

## Overview

:::caution
THIS GUIDE IS ONLY FOR INFRASTRUCTURE SETUP, PLEASE READ THE [GENERAL CONFIG](./general_config.md) TO CONFIGURE ENTITIES SUCH AS QUERY ENGINE & ACCESS PERMISSION.
:::

Eventhrough Querybook can be launched without any configuration, it is absolutely required for more powerful infrastructure/flexible customization. In this guide we will walkthrough different kind of environment settings you can set for Querybook. You can see all possible options and default values in this repo by checking out `querybook/config/querybook_default_config.yaml`.

### Making custom configs

There are two ways to pass custom configs to Querybook. The first way is using a custom config yaml file. You can write out the file and then pass it through querybook using docker volumes. For example you can add this in the docker-compose file:

```yaml
- path_to_my_custom_config.yaml:/opt/querybook/querybook/config/querybook_config.yaml
```

Otherwise you can also pass the environment variable directly when launching the docker image. The order of precedence for a config settings is as the follows:

1. Environment variables (highest priority)
2. querybook_config.yaml
3. querybook_default_config.yaml (lowest priority)

## Infrastructure

### Core

`FLASK_SECRET_KEY`: (**required**): This is the secret key that's used for securely signing the cookie. See https://flask.palletsprojects.com/en/1.1.x/config/#SECRET_KEY for more details.

`FLASK_CACHE_CONFIG` (optional): This can be used to provide caching for API endpoints and internal logic. Follow https://pythonhosted.org/Flask-Cache/ for more details. You should provide a serialized JSON dictionary to be passed into the config.

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
    - file: This will save the query results as csv files in the host

The following settings are only relevant if you are using `db`, note that all units are in bytes::

`DB_MAX_UPLOAD_SIZE` (optional, defaults to **5242880**): The max size of the result that can be retained, any row that exceeds the size limit will be truncated.

The following settings are only relevant if you are using `s3` or `gcs` (Google Cloud Storage), note that all units are in bytes:

-   `STORE_BUCKET_NAME` (optional): The Bucket name
-   `STORE_PATH_PREFIX` (optional, defaults to **''**): Key/Blob prefix for Querybook's stored results/logs
-   `STORE_MIN_UPLOAD_CHUNK_SIZE` (optional, defaults to **10485760**): The chunk size when uploading
-   `STORE_MAX_UPLOAD_CHUNK_NUM` (optional, defaults to **10000**): The number of chunks that can be uploaded, you can determine the maximum upload size by multiplying this with chunk size.
-   `STORE_READ_SIZE` (optional, defaults to 131072): The size of chunk when reading from store.
-   `STORE_MAX_READ_SIZE` (optional, defaults to 5242880): The max size of file Querybook will read for users to view.

The following settings are only relevant if you are using `s3` and your S3 bucket requires signature V4:

-   `S3_BUCKET_S3V4_ENABLED`(optional, defaults to false): `true`, if you want to enable signature v4.
-   `AWS_REGION`(optional, defaults to us-east-1): AWS region of your S3 bucket.

### Logging

`LOG_LOCATION` (optional): By default server logs goes to stderr. Supply a log path if you want the log to appear in a file.

## Authentication

`AUTH_BACKEND` (optional, defaults to **app.auth.password_auth**): Python path to the authentication file. By default Querybook provides:

    - app.auth.password_auth: Username/password based on registering on Querybook.
    - app.auth.oauth_auth: Oauth based authentication.

You can also supply any custom authentication added in the auth plugin. See "Add Auth" and "Plugins" guide for more details.

the next few configurations are only relevant if you are using OAuth based authentication:

-   `OAUTH_CLIENT_ID`(**required**)
-   `OAUTH_CLIENT_SECRET` (**required**)
-   `OAUTH_AUTHORIZATION_URL` (**required**): Url for oauth redirection
-   `OAUTH_TOKEN_URL` (**required**): Url to get the oauth token
-   `OAUTH_USER_PROFILE` (**required**): Url to get the user profile

for LDAP authentication:

- `LDAP_CONN`(**required**)
- `LDAP_USE_TLS` (optional, defaults to `False`)
- `LDAP_USE_BIND_USER` (optional, defaults to `False`)
  - If `False`: Direct LDAP login
    - Additional configuration:
      - `LDAP_USER_DN` (**required**) DN with {} for username/etc (ex. `uid={},dc=example,dc=com`)
    - Login flow:
      - Direct login using formatted `LDAP_USER_DN` + password
  - If `True`: Advanced LDAP login using _bind user_
    - Additional configuration:
      - `LDAP_BIND_USER` (**required**) Name of a _bind user_
      - `LDAP_BIND_PASSWORD` (**required**) Password of a _bind user_
      - `LDAP_SEARCH` (**required**) LDAP search base (ex. `ou=people,dc=example,dc=com`)
      - `LDAP_FILTER` (optional) LDAP filter condition (ex. `(departmentNumber=01000)`)
      - `LDAP_UID_FIELD` (optional) Field that matches the username when searching for the account to bind to (defaults to `uid`)
    - Login flow:
      1) Initialized connection for the _bind user_.
      2) Searching the _login user_ using the _bind user_ in LDAP dictionary based on `LDAP_SEARCH` and `LDAP_FILTER`.
      3) The _login user_ credentials are tested in direct login.
      4) If the previous steps were OK, the user is passed on.

If you want to force the user to login again after a certain time, you can the following variable:

`LOGS_OUT_AFTER` (optional, defaults to 0): Force user to log out after they have logged in for X number of seconds. If 0 then never expire the log in. In both cases the re-login is required if the browser is closed.

## Communication

By default Querybook supports email and slack notifications for sharing DataDocs and Query completions.

`PUBLIC_URL` (optional, defaults to localhost): The public url to access Querybook's website, used in oauth, email and slack.

### Slack

`QUERYBOOK_SLACK_TOKEN` (**optional**): Put the Bot User OAuth Access Token from slack here. See https://api.slack.com/docs/oauth#bots for more details.

### Email

`EMAILER_CONN` (optional, defaults to localhost:22): Location of the emailer server

`QUERYBOOK_EMAIL_ADDRESS` (optional, required for email): Origin address when sending emails
