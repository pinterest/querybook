from typing import Dict, List

import boto3
from env import QuerybookSettings
from lib.logger import get_logger

_LOG = get_logger(__file__)


class GlueDataCatalogClient:
    def __init__(self, catalog_id, region=QuerybookSettings.AWS_REGION):
        self.catalog_id = catalog_id
        self._glue_client = boto3.client("glue", region_name=region)

    def __del__(self):
        del self._glue_client

    def get_all_databases(self):
        """
        :return: The objects for all the Glue databases
        """
        _LOG.info("Get all databases")

        paginator = self._glue_client.get_paginator("get_databases")
        result = {}
        database_list = []

        for page in paginator.paginate(CatalogId=self.catalog_id):
            database_list.extend(page.get("DatabaseList"))

        result["DatabaseList"] = database_list

        return result

    def get_all_database_names(self):
        """
        :return: The names of all the Glue databases
        """
        _LOG.info("Extracting all databases names")

        databases = self.get_all_databases()
        database_list = databases.get("DatabaseList")

        result = [database.get("Name") for database in database_list]

        return result

    def get_all_tables(self, db_name):
        """
        :param db_name: The nam of the database
        :return: The Glue table objects for all the Glue tables of db_name
        """
        _LOG.info(f"Get all Glue tables for the database ${db_name}")
        paginator = self._glue_client.get_paginator("get_tables")
        table_list = []
        result = {}

        for page in paginator.paginate(CatalogId=self.catalog_id, DatabaseName=db_name):
            table_list.extend(page.get("TableList"))

        result["TableList"] = table_list

        return result

    def get_all_table_names(self, db_name):
        """
        :param db_name: The name of the database
        :return: The names for all the Glue tables
        """
        _LOG.info(f"Get tables names ${db_name}")

        tables = self.get_all_tables(db_name)
        table_list = tables.get("TableList")

        result = [table.get("Name") for table in table_list]

        return result

    def get_table(self, db_name, tb_name):
        """
        :param db_name: The name of the database
        :param tb_name: The name of the table
        :return: The Glue table object of db_name.tb_name
        """
        _LOG.info(f"Get Glue table information for for ${db_name}.${tb_name}")

        return self._glue_client.get_table(
            CatalogId=self.catalog_id, DatabaseName=db_name, Name=tb_name
        )

    def get_partitions(self, db_name, tb_name):
        """
        Gets partition information for db_name.tb_name from the Glue Data Catalog

        :param db_name: The name of the database
        :param tb_name: The name of the table
        :return: The Glue partition objects of db_name.tb_name
        """
        _LOG.info(f"Get Glue partitions for ${db_name}.${tb_name}")

        paginator = self._glue_client.get_paginator("get_partitions")
        partition_list = []
        result = {}

        for page in paginator.paginate(
            CatalogId=self.catalog_id, DatabaseName=db_name, TableName=tb_name
        ):
            partition_list.extend(page.get("Partitions", []))

        result["Partitions"] = partition_list

        return result

    def get_hms_style_partitions(
        self, db_name, tb_name, conditions: Dict[str, str] = None
    ) -> List[str]:
        """
        Gets partitiion information for db_name.tb_name from Glue Data Catalog and converts into a
        Hive Metastore style representation

        :param db_name: The name of the database
        :param tb_name: The name of the table
        :param conditions: Filter conditions for the partition in the format { dt: '2016-03-14'}
        :return: The partitions of db_name.tb_name in the format ['dt=2016-03-14/hr=00', 'dt=2016-03-14/hr=01', ...]
        """
        _LOG.info(f"Get hms style partitions for ${db_name}.${tb_name}")

        table = self.get_table(db_name, tb_name)
        partition_keys = table.get("Table").get("PartitionKeys")
        partition_key_names = [
            partition_key.get("Name") for partition_key in partition_keys
        ]

        partitions = self.get_partitions(db_name, tb_name)
        partition_list = partitions.get("Partitions")
        partition_values = [partition.get("Values") for partition in partition_list]

        result = []

        if conditions:
            for condition_key, condition_value in conditions.items():
                condition_key_index = partition_key_names.index(condition_key)
                partition_values = [
                    partition_value
                    for partition_value in partition_values
                    if partition_value[condition_key_index] == condition_value
                ]

        for partition_value in partition_values:
            result.append(
                "/".join(
                    [
                        key_name + "=" + value
                        for key_name, value in zip(partition_key_names, partition_value)
                    ]
                )
            )

        return result
