from lib.query_analysis.create_table.languages.hive import HiveCreateTable
from lib.table_upload.common import UploadTableColumnType
from unittest import TestCase


class HiveCreateTableTestCase(TestCase):
    def test_create_csv_table(self):
        create_table = HiveCreateTable(
            schema_name="foo",
            table_name="bar",
            column_name_types=[
                ("id", UploadTableColumnType.INTEGER),
                ("col1", "array"),
                ("col2", UploadTableColumnType.FLOAT),
                ("col3", UploadTableColumnType.STRING),
            ],
            file_format="CSV",
            file_location="hdfs://hello/world",
        )
        self.assertEqual(
            create_table.get_create_query(),
            """CREATE EXTERNAL TABLE foo.bar
(
`id` BIGINT,
`col1` array,
`col2` DOUBLE,
`col3` STRING
)
ROW FORMAT SERDE 'org.apache.hadoop.hive.serde2.OpenCSVSerde'
FIELDS TERMINATED BY ','
STORED AS TEXTFILE
TBLPROPERTIES ("skip.header.line.count"="1")
LOCATION 'hdfs://hello/world'""",
        )

    def test_create_parquet_table(self):
        create_table = HiveCreateTable(
            schema_name="foo",
            table_name="bar",
            column_name_types=[
                ("id", UploadTableColumnType.INTEGER),
                ("col1", "array"),
                ("col2", UploadTableColumnType.FLOAT),
                ("col3", UploadTableColumnType.STRING),
            ],
            file_format="PARQUET",
            file_location="hdfs://hello/world",
        )

        self.assertEqual(
            create_table.get_create_query(),
            """CREATE EXTERNAL TABLE foo.bar
(
`id` BIGINT,
`col1` array,
`col2` DOUBLE,
`col3` STRING
)
STORED AS PARQUET
LOCATION 'hdfs://hello/world'""",
        )

    def test_create_managed_parquet_table(self):
        create_table = HiveCreateTable(
            schema_name="foo",
            table_name="bar",
            column_name_types=[
                ("id", UploadTableColumnType.INTEGER),
                ("col1", "array"),
                ("col2", UploadTableColumnType.FLOAT),
                ("col3", UploadTableColumnType.STRING),
            ],
            file_format="PARQUET",
        )

        self.assertEqual(
            create_table.get_create_query(),
            """CREATE TABLE foo.bar
(
`id` BIGINT,
`col1` array,
`col2` DOUBLE,
`col3` STRING
)
STORED AS PARQUET""",
        )

    def test_create_table_with_properties(self):
        create_table = HiveCreateTable(
            schema_name="foo",
            table_name="bar",
            column_name_types=[
                ("id", UploadTableColumnType.INTEGER),
                ("col1", "array"),
                ("col2", UploadTableColumnType.FLOAT),
                ("col3", UploadTableColumnType.STRING),
            ],
            file_format="CSV",
            file_location="hdfs://hello/world",
            table_properties=["'foo'='bar'"],
        )
        self.assertEqual(
            create_table.get_create_query(),
            """CREATE EXTERNAL TABLE foo.bar
(
`id` BIGINT,
`col1` array,
`col2` DOUBLE,
`col3` STRING
)
ROW FORMAT SERDE 'org.apache.hadoop.hive.serde2.OpenCSVSerde'
FIELDS TERMINATED BY ','
STORED AS TEXTFILE
TBLPROPERTIES ('foo'='bar', "skip.header.line.count"="1")
LOCATION 'hdfs://hello/world'""",
        )

    def test_create_unknown_format(self):
        create_table = HiveCreateTable(
            schema_name="foo",
            table_name="bar",
            column_name_types=[
                ("id", UploadTableColumnType.INTEGER),
                ("col1", "array"),
                ("col2", UploadTableColumnType.FLOAT),
                ("col3", UploadTableColumnType.STRING),
            ],
            file_format="__HELLOWORLD__",
            file_location="hdfs://hello/world",
        )
        with self.assertRaises(Exception):
            create_table.get_create_query()
