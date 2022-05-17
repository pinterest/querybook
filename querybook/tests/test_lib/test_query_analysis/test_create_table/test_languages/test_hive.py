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
            file_location="hdfs://hello/world",
            file_format="CSV",
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
LOCATION 'hdfs://hello/world'TBLPROPERTIES ("skip.header.line.count"="1")""",
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
            file_location="hdfs://hello/world",
            file_format="PARQUET",
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
            file_location="hdfs://hello/world",
            file_format="__HELLOWORLD__",
        )
        with self.assertRaises(Exception):
            create_table.get_create_query()
