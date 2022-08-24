from lib.query_analysis.create_table.languages.presto import PrestoCreateTable
from lib.table_upload.common import UploadTableColumnType
from unittest import TestCase


class PrestoCreateTableTestCase(TestCase):
    def test_create_csv_table(self):
        create_table = PrestoCreateTable(
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
            """CREATE TABLE foo.bar
(
"id" VARCHAR,
"col1" VARCHAR,
"col2" VARCHAR,
"col3" VARCHAR
)
WITH (
external_location='hdfs://hello/world',
format = 'csv',
csv_escape = '\\',
csv_quote = '"',
csv_separator = ',',
skip_header_line_count = 1
)""",
        )

    def test_create_parquet_table(self):
        create_table = PrestoCreateTable(
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
            """CREATE TABLE foo.bar
(
"id" BIGINT,
"col1" array,
"col2" DOUBLE,
"col3" VARCHAR
)
WITH (
external_location='hdfs://hello/world',
format = 'PARQUET'
)""",
        )

    def test_create_managed_parquet_table(self):
        create_table = PrestoCreateTable(
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
"id" BIGINT,
"col1" array,
"col2" DOUBLE,
"col3" VARCHAR
)
WITH (
format = 'PARQUET'
)""",
        )

    def test_create_table_with_properties(self):
        create_table = PrestoCreateTable(
            schema_name="foo",
            table_name="bar",
            column_name_types=[
                ("id", UploadTableColumnType.INTEGER),
                ("col1", "array"),
            ],
            file_format="PARQUET",
            table_properties=["foo = 'bar'", "truth = 42"],
        )

        self.assertEqual(
            create_table.get_create_query(),
            """CREATE TABLE foo.bar
(
"id" BIGINT,
"col1" array
)
WITH (
foo = 'bar',
truth = 42,
format = 'PARQUET'
)""",
        )

    def test_create_unknown_format(self):
        create_table = PrestoCreateTable(
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
