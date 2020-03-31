---
id: setup_guide
title: Setup Guide
sidebar_label: Setup Guide
---

## Overview

There are two ways to setup DataHub:

1. [Single-Machine Instant Setup (In laptop or server)](quick_start.md)
2. Multi-Machine Setup

The single machine method is a quick way to setup DataHub for <5 users usage and it uses docker-compose to bring up all the necessary databases. Please check `Single Machine Setup` and `Post Setup Configuration` for details.

The multi-machine method allows DataHub to be scaled for hundreds/thousands of users. It is more complicated to setup and requires external databases. Please check `Multi-Machine Setup` and `Post Setup Configuration` for details.

## Multi-Machine Setup

Once further scalability is desired you can start each service individually in different machines, so you can scale them independently as needed.

#### Step 1: Update your environment variables configuration

See the configuration section for this.

#### Step 2: Start each service individually

You can start each service by the following commands:

-   Webserver: `make web`
-   Celery worker: `make worker`
-   Scheduler: `make scheduler`

If you add `prod_` in front of the service name (for example `make prod_web`), it will start the production version which uses the prod docker image, which has less logging, and no auto-reloading.

## Post Setup Configuration

1. By default the first user of DataHub is given the admin permission. Navigate to `/admin/` which contains the admin tools.
2. Select the "environment" tab and create an environment. All query engines and datadocs in DataHub need to belong to an environment.
3. If you use hive metastore, go to metastore page and configure a metastore. A daily job is auto created to ensure it gets updated daily at utc 0. You can adjust the frequency or manually kickoff a run.

    Note that hivemetastore is not required for a query engine to function.

4. Create a query engine and now DataHub should be ready to use.

Check out [general config guide](admin_guide/general_config.md) for more detailed info about datahub configuration.
