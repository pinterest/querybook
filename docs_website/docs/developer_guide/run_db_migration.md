---
id: run_db_migration
title: DB Migration
sidebar_label: DB Migration
---

## Adding a new DB migration

First, make changes to the SQLAlchemy database model definitions under `querybook/server/models/`,
then you can run the following code to generate the migration file:

```sh
# Edit querybook/alembic.ini sqlalchemy.url to point to the database you want to change
# go into the docker terminal
cd querybook
PYTHONPATH=server alembic revision --autogenerate -m "<>commit message<>"
```

Remember to always update the package version when making migration changes.

## Applying DB migrations

After pulling the latest changes, you can apply the migrations by running the following:

```sh
# Edit querybook/alembic.ini sqlalchemy.url to point to the database you want to change
# go into the docker terminal
cd querybook
PYTHONPATH=server alembic upgrade head
```
