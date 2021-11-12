"""Change params for Hive metastore loaders

Revision ID: aceefd7708b6
Revises: ea497b49195e
Create Date: 2021-11-12 15:17:50.332447

"""
from alembic import op
from sqlalchemy.orm import Session
from typing import List

from models.admin import QueryMetastore

# revision identifiers, used by Alembic.
revision = 'aceefd7708b6'
down_revision = 'ea497b49195e'
branch_labels = None
depends_on = None


def upgrade():
    session = Session(bind=op.get_bind())

    hms_loaders: List[QueryMetastore] = session.query(QueryMetastore).filter(QueryMetastore.loader == 'HMSMetastoreLoader').all()
    for hms_loader in hms_loaders:
        hms_loader.metastore_params = {'hms_connection': hms_loader.metastore_params, 'load_partitions': True}

    hms_thrift_loaders: List[QueryMetastore] = session.query(QueryMetastore).filter(QueryMetastore.loader == 'HMSThriftMetastoreLoader').all()
    for hms_thrift_loader in hms_thrift_loaders:
        hms_thrift_loader.metastore_params = {'load_partitions': True, **hms_thrift_loader.metastore_params}

    session.commit()


def downgrade():
    session = Session(bind=op.get_bind())

    hms_loaders: List[QueryMetastore] = session.query(QueryMetastore).filter(QueryMetastore.loader == 'HMSMetastoreLoader').all()
    for hms_loader in hms_loaders:
        hms_loader.metastore_params = hms_loader.metastore_params['hms_connection']

    hms_thrift_loaders: List[QueryMetastore] = session.query(QueryMetastore).filter(QueryMetastore.loader == 'HMSThriftMetastoreLoader').all()
    for hms_thrift_loader in hms_thrift_loaders:
        params = hms_thrift_loader.metastore_params.copy()
        params.pop('load_partitions', None)  # load_partitions might not be present, if the button wasn't touched during metastore creation
        hms_thrift_loader.metastore_params = params

    session.commit()
