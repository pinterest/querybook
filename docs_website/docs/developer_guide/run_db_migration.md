---
id: run_db_migration
title: DB Migration
sidebar_label: DB Migration
---

To make changes to the SQLAlchemy database model definitions, you need to run the following migrations:

```sh
# Edit querybook/alembic.ini sqlalchemy.url to point to the database
# go into the docker terminal
cd querybook
PYTHONPATH=server alembic revision --autogenerate -m "<>commit message<>"
PYTHONPATH=server alembic upgrade head

# OPTIONAL: if you ran the script from remote server
# and need to sync it back from devapp to local
./querybook/scripts/sync_alembic_from_remote [Your remote repo location]
```
