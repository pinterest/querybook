import unittest
from datetime import datetime
from unittest import TestCase

import boto3
from const.metastore import DataColumn, DataTable
from lib.metastore.loaders.glue_data_catalog_loader import GlueDataCatalogLoader

moto_import_failed = False
try:
    from moto import mock_glue
except ImportError:
    moto_import_failed = True

    def mock_glue(func):
        return func


METASTORE_DICT = {
    "id": 1,
    "name": "Test Glue Metastore",
    "loader": "GlueDataCatalogLoader",
    "metastore_params": {
        "catalog_id": "758373708967",
        "region": "us-east-1",
        "load_partitions": "True",
    },
    "acl_control": {},
}

# First database with one tables
DB_NAME_A = "db_a"
TABLE_NAME_A_1 = "table_a_1"
TABLE_INPUT_A_1 = {
    "Name": TABLE_NAME_A_1,
    "Description": "test description",
    "Owner": "test owner",
    "TableType": "EXTERNAL_TABLE",
    "StorageDescriptor": {
        "Columns": [
            {"Name": "col_a", "Type": "string", "Comment": "string"},
            {"Name": "col_b", "Type": "string", "Comment": "string"},
            {"Name": "col_c", "Type": "string"},
        ],
        "Location": f"s3://mybucket/{DB_NAME_A}/{TABLE_NAME_A_1}",
    },
    "PartitionKeys": [
        {
            "Name": "partition_date",
            "Type": "string",
        },
        {"Name": "partition_hour", "Type": "string"},
    ],
}
PARTITION_INPUT_A_1 = {"Values": ["2021-01-01", "15"]}
PARTITION_INPUT_A_2 = {"Values": ["2021-03-03", "20"]}
PARTITION_INPUT_A_3 = {"Values": ["2021-03-03", "22"]}
PARTITION_INPUT_A_4 = {"Values": ["2021-04-04", "20"]}

# Second database with three tables
DB_NAME_B = "db_b"
TABLE_NAME_B_1 = "table_b_1"
TABLE_INPUT_B_1 = {
    "Name": TABLE_NAME_B_1,
    "StorageDescriptor": {
        "Columns": [
            {"Name": "col_a", "Type": "string", "Comment": "string"},
            {"Name": "col_b", "Type": "string", "Comment": "string"},
            {"Name": "col_c", "Type": "string"},
        ],
        "Location": f"s3://mybucket/{DB_NAME_B}/{TABLE_NAME_B_1}",
    },
    "PartitionKeys": [
        {
            "Name": "partition_date",
            "Type": "string",
        },
        {"Name": "partition_hour", "Type": "string"},
    ],
}
TABLE_NAME_B_2 = "table_b_2"
TABLE_INPUT_B_2 = {
    "Name": TABLE_NAME_B_2,
    "StorageDescriptor": {
        "Columns": [
            {"Name": "col_a", "Type": "string", "Comment": "string"},
            {"Name": "col_b", "Type": "string", "Comment": "string"},
            {"Name": "col_c", "Type": "string"},
        ],
        "Location": f"s3://mybucket/{DB_NAME_B}/{TABLE_NAME_B_2}",
    },
    "PartitionKeys": [
        {
            "Name": "partition_date",
            "Type": "string",
        },
        {"Name": "partition_hour", "Type": "string"},
    ],
}
TABLE_NAME_B_3 = "table_b_3"
TABLE_INPUT_B_3 = {
    "Name": TABLE_NAME_B_3,
    "StorageDescriptor": {
        "Columns": [
            {"Name": "col_a", "Type": "string", "Comment": "string"},
            {"Name": "col_b", "Type": "string", "Comment": "string"},
            {"Name": "col_c", "Type": "string"},
        ],
        "Location": f"s3://mybucket/{DB_NAME_B}/{TABLE_NAME_B_3}",
    },
    "PartitionKeys": [
        {
            "Name": "partition_date",
            "Type": "string",
        },
        {"Name": "partition_hour", "Type": "string"},
    ],
}


@unittest.skipIf(
    moto_import_failed, "Skipping test because moto.mock_glue is not available"
)
class GlueDataCatalogLoaderTestCase(TestCase):
    @mock_glue
    def setUp(self) -> None:
        self.client = boto3.client("glue", "us-east-1")
        self.loader = GlueDataCatalogLoader(METASTORE_DICT)

    @mock_glue
    def test_get_all_schema_names(self):
        self.client.create_database(DatabaseInput={"Name": DB_NAME_A})
        self.client.create_database(DatabaseInput={"Name": DB_NAME_B})

        result = self.loader.get_all_schema_names()

        self.assertEqual(result, [DB_NAME_A, DB_NAME_B])

    @mock_glue
    def test_get_all_table_names_in_schema(self):
        self.client.create_database(DatabaseInput={"Name": DB_NAME_B})
        self.client.create_table(DatabaseName=DB_NAME_B, TableInput=TABLE_INPUT_B_1)
        self.client.create_table(DatabaseName=DB_NAME_B, TableInput=TABLE_INPUT_B_2)
        self.client.create_table(DatabaseName=DB_NAME_B, TableInput=TABLE_INPUT_B_3)

        result = self.loader.get_all_table_names_in_schema(DB_NAME_B)

        self.assertEqual(result, [TABLE_NAME_B_1, TABLE_NAME_B_2, TABLE_NAME_B_3])

    @mock_glue
    def test_get_table_and_columns(self):
        self.client.create_database(DatabaseInput={"Name": DB_NAME_A})
        self.client.create_table(DatabaseName=DB_NAME_A, TableInput=TABLE_INPUT_A_1)
        self.client.create_partition(
            DatabaseName=DB_NAME_A,
            TableName=TABLE_NAME_A_1,
            PartitionInput=PARTITION_INPUT_A_1,
        )
        self.client.create_partition(
            DatabaseName=DB_NAME_A,
            TableName=TABLE_NAME_A_1,
            PartitionInput=PARTITION_INPUT_A_2,
        )

        table = DataTable(
            name=TABLE_NAME_A_1,
            type=TABLE_INPUT_A_1.get("TableType"),
            owner=TABLE_INPUT_A_1.get("Owner"),
            table_created_at=int(datetime(1970, 1, 1).timestamp()),
            table_updated_at=int(datetime(1970, 1, 1).timestamp()),
            location=f"s3://mybucket/{DB_NAME_A}/{TABLE_NAME_A_1}",
            partitions=[
                "partition_date=2021-01-01/partition_hour=15",
                "partition_date=2021-03-03/partition_hour=20",
            ],
            raw_description=TABLE_INPUT_A_1.get("Description"),
        )

        columns = [
            DataColumn(
                TABLE_INPUT_A_1.get("StorageDescriptor").get("Columns")[0].get("Name"),
                TABLE_INPUT_A_1.get("StorageDescriptor").get("Columns")[0].get("Type"),
                TABLE_INPUT_A_1.get("StorageDescriptor")
                .get("Columns")[0]
                .get("Comment"),
            ),
            DataColumn(
                TABLE_INPUT_A_1.get("StorageDescriptor").get("Columns")[1].get("Name"),
                TABLE_INPUT_A_1.get("StorageDescriptor").get("Columns")[1].get("Type"),
                TABLE_INPUT_A_1.get("StorageDescriptor")
                .get("Columns")[1]
                .get("Comment"),
            ),
            DataColumn(
                TABLE_INPUT_A_1.get("StorageDescriptor").get("Columns")[2].get("Name"),
                TABLE_INPUT_A_1.get("StorageDescriptor").get("Columns")[2].get("Type"),
            ),
            DataColumn(
                TABLE_INPUT_A_1.get("PartitionKeys")[0].get("Name"),
                TABLE_INPUT_A_1.get("PartitionKeys")[0].get("Type"),
            ),
            DataColumn(
                TABLE_INPUT_A_1.get("PartitionKeys")[1].get("Name"),
                TABLE_INPUT_A_1.get("PartitionKeys")[1].get("Type"),
            ),
        ]

        result_table, result_columns = self.loader.get_table_and_columns(
            DB_NAME_A, TABLE_NAME_A_1
        )

        self.assertEqual(result_table, table)
        self.assertEqual(result_columns, columns)

    @mock_glue
    def test_get_partitions(self):
        self.client.create_database(DatabaseInput={"Name": DB_NAME_A})
        self.client.create_table(DatabaseName=DB_NAME_A, TableInput=TABLE_INPUT_A_1)
        self.client.create_partition(
            DatabaseName=DB_NAME_A,
            TableName=TABLE_NAME_A_1,
            PartitionInput=PARTITION_INPUT_A_1,
        )
        self.client.create_partition(
            DatabaseName=DB_NAME_A,
            TableName=TABLE_NAME_A_1,
            PartitionInput=PARTITION_INPUT_A_2,
        )
        self.client.create_partition(
            DatabaseName=DB_NAME_A,
            TableName=TABLE_NAME_A_1,
            PartitionInput=PARTITION_INPUT_A_3,
        )
        self.client.create_partition(
            DatabaseName=DB_NAME_A,
            TableName=TABLE_NAME_A_1,
            PartitionInput=PARTITION_INPUT_A_4,
        )

        conditions = {"partition_date": "2021-03-03"}
        expected_partitions = [
            "partition_date=2021-03-03/partition_hour=20",
            "partition_date=2021-03-03/partition_hour=22",
        ]
        result_partitions = self.loader.get_partitions(
            DB_NAME_A, TABLE_NAME_A_1, conditions
        )
        self.assertEqual(result_partitions, expected_partitions)

        conditions["partition_hour"] = "20"
        expected_partitions = [
            "partition_date=2021-03-03/partition_hour=20",
        ]
        result_partitions = self.loader.get_partitions(
            DB_NAME_A, TABLE_NAME_A_1, conditions
        )
        self.assertEqual(result_partitions, expected_partitions)
