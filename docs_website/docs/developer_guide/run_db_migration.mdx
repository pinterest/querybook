---
id: run_db_migration
title: DB Migration
sidebar_label: DB Migration
---

## Adding a new DB migration

First, make changes to the SQLAlchemy database model definitions under `querybook/server/models/`,
then you can run the following code to generate the migration file:

-   Note: you must run this inside the docker container via `docker exec -it <container_name> bash`
-   Either web or worker container works

```sh
# Edit querybook/alembic.ini sqlalchemy.url to point to the database you want to change
cd querybook
PYTHONPATH=server alembic revision --autogenerate -m "<>commit message<>"
```

Remember to always update the package version when making migration changes.

## Applying DB migrations

After pulling the latest changes, you can apply the migrations by running the following:

-   This must also be inside docker container / k8s pod
-   DATABASE_CONN must be configured to point to the database you want to change

```sh
# Edit querybook/alembic.ini sqlalchemy.url to point to the database you want to change
cd querybook
PYTHONPATH=server alembic upgrade head
```
