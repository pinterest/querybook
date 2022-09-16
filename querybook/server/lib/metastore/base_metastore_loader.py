from abc import ABCMeta, abstractmethod, abstractclassmethod
import gevent
import math
from typing import NamedTuple, List, Dict, Tuple, Optional
import traceback

from app.db import DBSession, with_session
from lib.logger import get_logger

from lib.form import AllFormField
from lib.utils import json
from lib.utils.utils import with_exception
from logic.elasticsearch import update_table_by_id, delete_es_table_by_id
from logic.metastore import (
    create_schema,
    delete_schema,
    create_table,
    delete_table,
    create_table_information,
    create_column,
    delete_column,
    iterate_data_schema,
    get_table_by_schema_id,
    get_column_by_table_id,
    get_schema_by_name,
    get_table_by_schema_id_and_name,
)

from .utils import MetastoreTableACLChecker

LOG = get_logger(__name__)


class DataSchema(NamedTuple):
    name: str


class DataTable(NamedTuple):
    name: str

    # The type of table, it can be an arbitrary string
    type: str = None
    owner: str = None

    # description from metastore, expect HTML format
    description: str = None

    # Expected in UTC seconds
    table_created_at: int = None
    table_updated_at: int = None
    table_updated_by: str = None

    # size of table
    data_size_bytes: int = None
    # Location of the raw file
    location: str = None

    # Json arrays of partitions
    partitions: List = []

    # Store the raw info here
    raw_description: str = None

    # Arrays of partition keys
    partition_keys: List[str] = []


class DataColumn(NamedTuple):
    name: str
    type: str

    # column comment from sql query when creating the table
    comment: str = None

    # user edited description from metastore, expect HTML format
    description: str = None


class BaseMetastoreLoader(metaclass=ABCMeta):
    def __init__(self, metastore_dict: Dict):
        self.metastore_id = metastore_dict["id"]
        self.acl_checker = MetastoreTableACLChecker(metastore_dict["acl_control"])

    @with_session
    def sync_table(
        self, schema_name: str, table_name: str, session=None
    ) -> Optional[int]:
        """Given a full qualified table name, sync the table with metastore.
          - If table is not in the allow list or in the deny list,
            or it doesn't exsit in neither metastore nor database,
            do nothing, return None
          - If table exists in metastore, sync the table from metastore
            to database, return table id
          - If table doesn't exsit in metastore, but exists in database,
            delete it from database, return -1

        Arguments:
            schema_name {str} -- the schema name
            table_name {str} -- the table name

        Returns:
            Optional[int] -- None | table id | -1
        """
        try:
            # return None if the table is not in the allow list or in the deny list
            if not self.acl_checker.is_table_valid(schema_name, table_name):
                return None

            # get table from metastore
            table, columns = self.get_table_and_columns(schema_name, table_name)

            # get schema and table from querybook database
            db_schema = get_schema_by_name(
                schema_name, self.metastore_id, session=session
            )
            db_table = None
            if db_schema:
                db_table = get_table_by_schema_id_and_name(
                    db_schema.id, table_name, session=session
                )

            # table doesn't exsit in neither metastore nor database
            if not table and not db_table:
                return None

            # table doesn't exist in metastore, delete the table in database
            if not table:
                delete_table(table_id=db_table.id, session=session)
                return -1

            # table exists in metastore, sync it
            schema_is_newly_created = False
            if db_schema is None:
                # Create the schema first if doesn't exist in database
                schema_is_newly_created = True
                db_schema = create_schema(
                    name=schema_name,
                    table_count=1,
                    metastore_id=self.metastore_id,
                    commit=False,
                    session=session,
                )

            table_id = self._create_table_table(
                db_schema.id, schema_name, table_name, table, columns, session=session
            )
            # Remove creation of new schema if we failed to create table
            if table_id is None and schema_is_newly_created:
                session.expunge(db_schema)

            return table_id

        except Exception:
            LOG.error(traceback.format_exc())
            return None

    @with_session
    def sync_create_or_update_table(
        self, schema_name: str, table_name: str, session=None
    ) -> int:
        """DEPRECATED!!! PLEASE USE `sync_table` INSTEAD.
        Given a full qualified table name,
        sync the data in metastore with database.
        Note: if table does not exist, this doesn't create a new table. But
        it does create an empty schema.

        Arguments:
            schema_name {str} -- the schema name
            table_name {str} -- the table name

        Returns:
            int -- the table id
        """
        schema_is_newly_created = False
        data_schema = get_schema_by_name(
            schema_name, self.metastore_id, session=session
        )

        if data_schema is None:
            # If no schema, create it
            # However, if the table turns out to not exist
            # then we will reset the transaction to remove it
            schema_is_newly_created = True
            data_schema = create_schema(
                name=schema_name,
                table_count=1,
                metastore_id=self.metastore_id,
                commit=False,
                session=session,
            )

        table_id = self._create_table_table(
            data_schema.id, schema_name, table_name, session=session
        )

        # Remove creation of new schema if we failed to create table
        if table_id is None and schema_is_newly_created:
            session.expunge(data_schema)

        return table_id

    @with_session
    def sync_delete_table(self, schema_name, table_name, session=None):
        """DEPRECATED!!! PLEASE USE `sync_table` INSTEAD.
        Given a full qualified table name,
        Remove the table if it exists

        Arguments:
            schema_name {str} -- the schema name
            table_name {str} -- the table name

        """
        # Double check if the table is indeed removed
        table_exists = self.check_if_table_exists(schema_name, table_name)
        # If no schema, then table doesn't exist
        schema = get_schema_by_name(schema_name, self.metastore_id, session=session)
        if not table_exists and schema is not None:
            table = get_table_by_schema_id_and_name(
                schema.id, table_name, session=session
            )
            if table:
                delete_table(table_id=table.id, session=session)

    def check_if_table_exists(self, schema_name: str, table_name: str) -> bool:
        """Check if schema_name.table_name exists in DB

        Args:
            schema_name (str): Name of schema
            table_name (str): Name of table

        Returns:
            bool: True if exists, False otherwise
        """
        try:
            table_names = self.get_all_table_names_in_schema(schema_name)
            return table_name in table_names
        except Exception:
            # Assume table does not exist if an exception occurred while
            # trying to fetch all tables under schema
            return False

    def check_if_schema_exists(self, schema_name: str) -> bool:
        """Similar to above, but only checks if schema exists in DB

        Args:
            schema_name (str): Name of schema

        Returns:
            bool: True if exists
        """
        schema_names = self.get_all_schema_names()
        return schema_name in schema_names

    def load(self):
        schema_tables = []
        schema_names = set(self._get_all_filtered_schema_names())

        with DBSession() as session:
            delete_schema_not_in_metastore(
                self.metastore_id, schema_names, session=session
            )
            for schema_name in schema_names:
                table_names = self._get_all_filtered_table_names(schema_name)
                schema_id = create_schema(
                    name=schema_name,
                    table_count=len(table_names),
                    metastore_id=self.metastore_id,
                    session=session,
                ).id
                delete_table_not_in_metastore(schema_id, table_names, session=session)
                schema_tables += [
                    (schema_id, schema_name, table_name) for table_name in table_names
                ]
        self._create_tables_batched(schema_tables)

    def get_latest_partition(
        self, schema_name: str, table_name: str, conditions: Dict[str, str] = None
    ):
        partitions = self.get_partitions(schema_name, table_name, conditions)
        latest_partition = partitions[-1] if partitions and len(partitions) else None
        return latest_partition

    def _create_tables_batched(self, schema_tables):
        """Create greenlets for create table batches

        Arguments:
            schema_tables {List[schema_id, schema_name, table_name]} -- List of configs to load table
        """
        batch_size = self._get_batch_size(len(schema_tables))
        greenlets = []
        thread_num = 0
        while True:
            table_batch = schema_tables[
                (thread_num * batch_size) : ((thread_num + 1) * batch_size)
            ]
            thread_num += 1

            if len(table_batch):
                greenlets.append(gevent.spawn(self._create_tables, table_batch))
            else:
                break
        gevent.joinall(greenlets)

    def _create_tables(self, schema_tables):
        with DBSession() as session:
            for (schema_id, schema_name, table) in schema_tables:
                self._create_table_table(schema_id, schema_name, table, session=session)

    @with_session
    def _create_table_table(
        self, schema_id, schema_name, table_name, table=None, columns=None, session=None
    ):
        """Create or update a table.
        If detailed table info is given (parameter table and columns), it will just use
        them to create/update the table.  Otherwise, it will try to get the table
        info from the metastore first and then create/update.
        """
        if not table:
            try:
                table, columns = self.get_table_and_columns(schema_name, table_name)
            except Exception:
                LOG.error(traceback.format_exc())

        if not table:
            return None

        try:
            table_id = create_table(
                name=table.name,
                type=table.type,
                owner=table.owner,
                table_created_at=table.table_created_at,
                table_updated_by=table.table_updated_by,
                table_updated_at=table.table_updated_at,
                data_size_bytes=table.data_size_bytes,
                location=table.location,
                column_count=len(columns),
                schema_id=schema_id,
                session=session,
            ).id
            create_table_information(
                data_table_id=table_id,
                description=table.description,
                latest_partitions=json.dumps((table.partitions or [])[-10:]),
                earliest_partitions=json.dumps((table.partitions or [])[:10]),
                hive_metastore_description=table.raw_description,
                partition_keys=table.partition_keys,
                session=session,
            )
            delete_column_not_in_metastore(
                table_id, set(map(lambda c: c.name, columns)), session=session
            )

            for column in columns:
                create_column(
                    name=column.name,
                    type=column.type,
                    comment=column.comment,
                    description=column.description,
                    table_id=table_id,
                    commit=False,
                    session=session,
                )
            session.commit()
            update_table_by_id(table_id, session=session)
            return table_id
        except Exception:
            session.rollback()
            LOG.error(traceback.format_exc())

    @with_exception
    def _get_all_filtered_schema_names(self) -> List[str]:
        return [
            schema_name
            for schema_name in self.get_all_schema_names()
            if self.acl_checker.is_schema_valid(schema_name)
        ]

    @with_exception
    def _get_all_filtered_table_names(self, schema_name: str) -> List[str]:
        return [
            table_name
            for table_name in self.get_all_table_names_in_schema(schema_name)
            if self.acl_checker.is_table_valid(schema_name, table_name)
        ]

    def _get_batch_size(self, num_tables: int):
        parallelization_setting = self._get_parallelization_setting()
        num_threads = parallelization_setting["num_threads"]
        min_batch_size = parallelization_setting["min_batch_size"]

        batch_size = max(int(math.ceil(num_tables / num_threads)), min_batch_size)
        return batch_size

    def get_partitions(
        self, schema_name: str, table_name: str, conditions: Dict[str, str] = None
    ) -> List[str]:
        """Override this method to return a list of the given table's partitions
        Returns None by default.

        Returns:
            List[str] -- [partition keys]
        """
        return None

    @abstractmethod
    def get_all_schema_names(self) -> List[str]:
        """Override this to get a list of all schema names

        Returns:
            List[str] -- [schema name]
        """
        pass

    @abstractmethod
    def get_all_table_names_in_schema(self, schema_name: str) -> List[str]:
        """Override this to get a list of all table names under given schema

        Arguments:
            schema_name {str}

        Returns:
            List[str] -- [A list of tbale names]
        """
        pass

    @abstractmethod
    def get_table_and_columns(
        self, schema_name: str, table_name: str
    ) -> Tuple[DataTable, List[DataColumn]]:
        """Override this to get the table given by schema name and table name, and a list of its columns

        Arguments:
            schema_name {[str]}
            table_name {[str]}

        Returns:
            Tuple[DataTable, List[DataColumn]] -- Return [null, null] if not found
        """
        pass

    @abstractclassmethod
    def get_metastore_params_template(self) -> AllFormField:
        """Override this to get the form field required for the metastore

        Returns:
            AllFormField -- The form field template
        """
        pass

    def _get_parallelization_setting(self):
        """Override this to have different parallelism.

           The num_threads determines the maximum number of threads
           that will be used. The min_batch_size determines the minimum
           number of tables each threads will process.

           For example, if you have num_threads at 2 and min_batch_size at 100.
           Then only 1 thread would be used unless you process more than 100 tables.

        Returns:
            dict: 'num_threads' | 'min_batch_size' -> int
        """
        return {"num_threads": 10, "min_batch_size": 50}

    @classmethod
    def serialize_loader_class(cls):
        return {
            "name": cls.__name__,
            "template": cls.get_metastore_params_template().to_dict(),
        }


@with_session
def delete_schema_not_in_metastore(metastore_id, schema_names, session=None):
    for data_schema in iterate_data_schema(metastore_id, session=session):
        LOG.info("checking schema %d" % data_schema.id)
        if data_schema.name not in schema_names:
            # We delete table 1 by 1 since we need to delete it for elasticsearch
            # Maybe we can optimize it to allow batch deletion
            for table in data_schema.tables:
                table_id = table.id
                delete_table(table_id=table_id, commit=False, session=session)
                delete_es_table_by_id(table_id)
            delete_schema(id=data_schema.id, commit=False, session=session)
            LOG.info("deleted schema %d" % data_schema.id)
    session.commit()


@with_session
def delete_table_not_in_metastore(schema_id, table_names, session=None):
    db_tables = get_table_by_schema_id(schema_id, session=session)

    with session.no_autoflush:
        for data_table in db_tables:
            if data_table.name not in table_names:
                table_id = data_table.id
                delete_table(table_id=table_id, commit=False, session=session)
                delete_es_table_by_id(table_id)
                LOG.info(f"deleted table {table_id}")
        session.commit()


@with_session
def delete_column_not_in_metastore(table_id, column_names, session=None):
    db_columns = get_column_by_table_id(table_id, session=session)

    for column in db_columns:
        if column.name not in column_names:
            delete_column(id=column.id, commit=False, session=session)
            LOG.info("deleted column %d" % column.id)
    session.commit()
