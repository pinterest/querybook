from unittest import TestCase

from lib.query_analysis.transform import (
    format_query,
    get_select_statement_limit,
    transform_to_limited_query,
    transform_to_sampled_query,
)


class GetSelectStatementLimitTestCase(TestCase):
    def test_not_select_statements(self):
        tests = [
            ("DELETE FROM table_1 WHERE field = 1;", None),
            ("CREATE DATABASE IF NOT EXISTS db_1;", None),
            ("CREATE TABLE table_1 (field1 INT);", None),
            ("TRUNCATE TABLE table_1;", None),
            ("DROP TABLE IF EXISTS db.table1; CREATE TABLE db.table1;", None),
            ("INSERT INTO table_1 (field1) VALUES (1);", None),
            ("UPDATE table_1 SET field1 = 1 WHERE field = 1;", None),
        ]
        for query, expected in tests:
            with self.subTest(query=query):
                self.assertEqual(get_select_statement_limit(query), expected)

    def test_select_no_limit(self):
        query = "SELECT max(field) FROM tbl JOIN (SELECT * FROM tbl2) t2 ON tbl.a = t2.b GROUP BY c"
        self.assertEqual(get_select_statement_limit(query), -1)

    def test_select_with_limit(self):
        tests = [
            (
                "SELECT max(field) FROM tbl JOIN (SELECT * FROM tbl2 LIMIT 10) t2 ON tbl.a = t2.b GROUP BY c HAVING max(field) < 2 LIMIT 10",
                10,
            ),
            ("SELECT * FROM table_1 ORDER BY id FETCH FIRST 10 ROWS ONLY;", 10),
            (
                "SELECT * FROM table_1 ORDER BY id OFFSET 10 FETCH NEXT 20 ROWS ONLY;",
                20,
            ),
            ("SELECT * FROM (SELECT * FROM table LIMIT 5) AS x LIMIT 10", 10),
            ("SELECT * FROM table_1 WHERE field = 1 LIMIT 1000;", 1000),
        ]
        for query, expected in tests:
            with self.subTest(query=query):
                self.assertEqual(get_select_statement_limit(query), expected)


class GetLimitedQueryTestCase(TestCase):
    def test_limit_is_not_specified(self):
        tests = [
            "SELECT * FROM table_1 WHERE field = 1",
            """
            SELECT * FROM table_1 WHERE field = 1;
            SELECT * FROM table_1 WHERE field = 1;
            """,
        ]
        for query in tests:
            with self.subTest(query=query):
                self.assertEqual(transform_to_limited_query(query), query)

    def test_query_has_limit(self):
        tests = [
            "SELECT * FROM table_1 ORDER BY id FETCH FIRST 10 ROWS ONLY",
            "SELECT * FROM table_1 ORDER BY id OFFSET 10 FETCH NEXT 10 ROWS ONLY",
            "SELECT * FROM (SELECT * FROM table LIMIT 5) AS x LIMIT 10",
            "SELECT * FROM table_1 WHERE field = 1 LIMIT 1000",
        ]
        for query in tests:
            with self.subTest(query=query):
                self.assertEqual(
                    transform_to_limited_query(query, 100), format_query(query)
                )

    def test_query_limited(self):
        tests = [
            ("SELECT * FROM table_1", "SELECT * FROM table_1 LIMIT 100"),
            ("SELECT * FROM table_1;", "SELECT * FROM table_1 LIMIT 100"),
            (
                "SELECT field, count(*) FROM table_1 WHERE deleted = false GROUP BY field ORDER BY field",
                "SELECT field, COUNT(*) FROM table_1 WHERE deleted = FALSE GROUP BY field ORDER BY field LIMIT 100",
            ),
            (
                "SELECT * FROM table_1 -- limit here",
                "SELECT * FROM table_1 /* limit here */ LIMIT 100",
            ),
            (
                "SELECT id, account, 'limit' FROM querybook2.table ORDER by 'limit' ASC",
                "SELECT id, account, 'limit' FROM querybook2.table ORDER BY 'limit' ASC LIMIT 100",
            ),
            (
                "SELECT * FROM table_1 \nWHERE field = 1",
                "SELECT * FROM table_1 WHERE field = 1 LIMIT 100",
            ),
            (
                "SELECT field, count(*) FROM table_1 WHERE deleted = false GROUP BY field ORDER BY field",
                "SELECT field, COUNT(*) FROM table_1 WHERE deleted = FALSE GROUP BY field ORDER BY field LIMIT 100",
            ),
            (
                "SELECT * FROM (SELECT * FROM table LIMIT 5) AS x",
                "SELECT * FROM (SELECT * FROM table LIMIT 5) AS x LIMIT 100",
            ),
            (
                "SELECT * FROM (SELECT * FROM table LIMIT 5) AS x OUTER JOIN (SELECT * FROM table2 LIMIT 5) AS y ON x.id = y.id",
                "SELECT * FROM (SELECT * FROM table LIMIT 5) AS x OUTER JOIN (SELECT * FROM table2 LIMIT 5) AS y ON x.id = y.id LIMIT 100",
            ),
        ]
        for query, expected in tests:
            with self.subTest(query=query):
                self.assertEqual(
                    transform_to_limited_query(query, 100), format_query(expected)
                )


class GetSampledQueryTestCase(TestCase):
    def test_single_statement_with_sampled_table(self):
        query = "SELECT * FROM default.users;"
        tables = {"default.users": {"sampled_table": "default.users_sampled"}}
        expected = "SELECT * FROM default.users_sampled;"
        self.assertEqual(
            transform_to_sampled_query(query, sampling_tables=tables),
            format_query(expected),
        )

    def test_single_statement_with_sample_rate(self):
        query = "SELECT * FROM default.users;"
        tables = {"default.users": {"sample_rate": "75"}}
        trino_expected = "SELECT * FROM default.users TABLESAMPLE SYSTEM (75);"
        spark_expected = "SELECT * FROM default.users TABLESAMPLE (75 PERCENT);"
        self.assertEqual(
            transform_to_sampled_query(query, sampling_tables=tables, language="trino"),
            format_query(trino_expected, language="trino"),
        )
        self.assertEqual(
            transform_to_sampled_query(
                query, sampling_tables=tables, language="sparksql"
            ),
            format_query(spark_expected, language="sparksql"),
        )

    def test_table_alias_with_sampled_table(self):
        query = "SELECT * FROM default.users as u;"
        tables = {"default.users": {"sampled_table": "default.users_sampled"}}
        expected = "SELECT * FROM default.users_sampled as u;"
        self.assertEqual(
            transform_to_sampled_query(query, sampling_tables=tables),
            format_query(expected),
        )

    def test_table_alias_with_sample_rate(self):
        query = "SELECT * FROM default.users as u;"
        trino_expected = "SELECT * FROM default.users as u TABLESAMPLE SYSTEM (75);"
        spark_expected = "SELECT * FROM default.users TABLESAMPLE (75 PERCENT) as u;"
        tables = {"default.users": {"sample_rate": "75"}}
        self.assertEqual(
            transform_to_sampled_query(query, sampling_tables=tables, language="trino"),
            format_query(trino_expected, language="trino"),
        )
        self.assertEqual(
            transform_to_sampled_query(
                query, sampling_tables=tables, language="sparksql"
            ),
            format_query(spark_expected, language="sparksql"),
        )

    def test_multiple_statements_with_sampled_table(self):
        query = "SELECT * FROM users_1;\nSELECT * FROM default.users_2;"
        tables = {
            "users_1": {"sampled_table": "default.users_1_sampled"},
            "default.users_2": {"sampled_table": "default.users_2_sampled"},
        }
        expected = "SELECT * FROM default.users_1_sampled;\nSELECT * FROM default.users_2_sampled"
        self.assertEqual(
            transform_to_sampled_query(query, sampling_tables=tables),
            format_query(expected),
        )

    def test_multiple_statements_with_sample_rate(self):
        query = "SELECT * FROM users_1;\nSELECT * FROM default.users_2;"
        tables = {
            "users_1": {"sample_rate": "15"},
            "default.users_2": {"sample_rate": "35"},
        }
        trino_expected = "SELECT * FROM users_1 TABLESAMPLE SYSTEM (15);\nSELECT * FROM default.users_2 TABLESAMPLE SYSTEM (35)"
        spark_expected = "SELECT * FROM users_1 TABLESAMPLE (15 PERCENT);\nSELECT * FROM default.users_2 TABLESAMPLE (35 PERCENT)"
        self.assertEqual(
            transform_to_sampled_query(query, sampling_tables=tables, language="trino"),
            format_query(trino_expected, language="trino"),
        )
        self.assertEqual(
            transform_to_sampled_query(
                query, sampling_tables=tables, language="sparksql"
            ),
            format_query(spark_expected, language="sparksql"),
        )

    def test_sub_query_with_sampled_table(self):
        query = """
        WITH x AS (
            SELECT a FROM y where c>20
        )
        SELECT a FROM x where a > 10
        """
        tables = {"y": {"sampled_table": "y_sampled"}}
        expected = """
        WITH x AS (
          SELECT a FROM y_sampled where c>20
        )
        SELECT a FROM x where a > 10
        """
        self.assertEqual(
            transform_to_sampled_query(query, sampling_tables=tables),
            format_query(expected),
        )

    def test_sub_query_with_sample_rate(self):
        query = """
        WITH x AS (
            SELECT a FROM y where c>20
        )
        SELECT a FROM x where a > 10
        """
        tables = {"y": {"sample_rate": "75"}}
        trino_expected = """
        WITH x AS (
          SELECT a FROM y TABLESAMPLE SYSTEM (75) where c>20
        )
        SELECT a FROM x where a > 10
        """
        spark_expected = """
        WITH x AS (
          SELECT a FROM y TABLESAMPLE (75 PERCENT) where c>20
        )
        SELECT a FROM x where a > 10
        """
        self.assertEqual(
            transform_to_sampled_query(query, sampling_tables=tables, language="trino"),
            format_query(trino_expected, language="trino"),
        )
        self.assertEqual(
            transform_to_sampled_query(
                query, sampling_tables=tables, language="sparksql"
            ),
            format_query(spark_expected, language="sparksql"),
        )

    def test_join_with_sampled_table(self):
        query = (
            "SELECT * FROM default.users JOIN default.pins ON users.id = pins.user_id"
        )
        tables = {
            "default.users": {"sampled_table": "default.users_sampled"},
            "default.pins": {"sample_rate": "15"},
        }
        trino_expected = "SELECT * FROM default.users_sampled JOIN default.pins TABLESAMPLE SYSTEM (15) ON users.id = pins.user_id"
        self.assertEqual(
            transform_to_sampled_query(query, sampling_tables=tables, language="trino"),
            format_query(trino_expected, language="trino"),
        )
        tables = {
            "default.users": {"sample_rate": "15"},
            "default.pins": {"sampled_table": "default.pins_sampled"},
        }
        spark_expected = "SELECT * FROM default.users TABLESAMPLE (15 PERCENT) JOIN default.pins_sampled ON users.id = pins.user_id"
        self.assertEqual(
            transform_to_sampled_query(
                query, sampling_tables=tables, language="sparksql"
            ),
            format_query(spark_expected, language="sparksql"),
        )
