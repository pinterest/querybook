from unittest import TestCase
from lib.query_analysis.lineage import (
    process_query,
    tokenize_by_statement,
    get_statement_placeholders,
    get_statement_schema,
    get_table_statement_type,
)


class ProcessQueryTestCase(TestCase):
    """sample test for setting up scheduled testing"""

    def test_create_insert_query(self):
        """testing if process_query returns correct lineage information for multi-line
        query that has insert and create
        """
        query = """
            USE analytics;
            CREATE EXTERNAL TABLE IF NOT EXISTS example_1
            (id INT, count BIGINT) PARTITIONED BY (dt STRING)
            LOCATION 's3n://fakebucket/fake/path/';
            INSERT OVERWRITE TABLE example_1
            PARTITION (dt = '%(end_date)s')
            SELECT DISTINCT id, count from default.example_2
            where dt <= '2019-01-01' and dt >= date_sub('2018-01-01', 28)
            and to_date(created_at) >= start_dt
        """

        expected_table_per_statement = [
            [],
            ["analytics.example_1"],
            ["analytics.example_1", "default.example_2"],
        ]
        expected_lineage_per_statement = [
            [],
            [],
            [{"source": "default.example_2", "target": "analytics.example_1"}],
        ]
        processed_query = process_query(query)
        self.assertIsInstance(processed_query, tuple)

        table_per_statement, lineage_per_statement = processed_query
        for stmt, expected_stmt in zip(
            table_per_statement, expected_table_per_statement
        ):
            self.assertCountEqual(stmt, expected_stmt)
        self.assertListEqual(lineage_per_statement, expected_lineage_per_statement)

    def test_select_statement(self):
        query = """
SELECT
    w9.Country,
    w9.Rank AS [2019],
    w8.Rank AS [2018],
    w7.HappinessRank AS [2017],
    w6.HappinessRank AS [2016],
    w5.HappinessRank AS [2015]
FROM
    main.world_happiness_2019 w9
    INNER JOIN main.world_happiness_2018 w8 ON w9.Country = w8.Country
    INNER JOIN main.world_happiness_2017 w7 ON w9.Country = w7.Country
    INNER JOIN main.world_happiness_2016 w6 ON w9.Country = w6.Country
    INNER JOIN main.world_happiness_2015 w5 ON w9.Country = w5.Country
    AND (w5.Region = "{{Region}}");
-- Region is a template variable with the value of 'Western Europe'
-- click on the <> button on the bottom right of the DataDoc to configure more!
        """
        processed_query = process_query(query)
        self.assertIsInstance(processed_query, tuple)
        self.assertEqual(len(processed_query), 2)
        self.assertEqual(len(processed_query[0]), 1)
        self.assertSetEqual(
            set(processed_query[0][0]),
            set(
                [
                    "main.world_happiness_2019",
                    "main.world_happiness_2018",
                    "main.world_happiness_2017",
                    "main.world_happiness_2016",
                    "main.world_happiness_2015",
                ]
            ),
        )

        self.assertEqual(
            processed_query[1],
            ([[]]),
        )

    def test_empty_statement(self):
        self.assertEqual(process_query(""), ([], []))
        self.assertEqual(process_query("\t\n\t\n"), ([], []))
        self.assertEqual(process_query("\n\n;\n\n;\n\n"), ([[], []], [[], []]))


class TokenizeByStatementTestCase(TestCase):
    def test_tokenize_by_statement(self):
        raw_query = """
            select b from test
                -- a comment
            where abc=1 group by b order by b;
        """
        statements = tokenize_by_statement(raw_query)
        self.assertEqual(len(statements), 1)

        statement = statements[0]
        self.assertEqual(len(list(statement.flatten())), 27)

        statement_text = "".join(map(lambda t: t.value, list(statement.flatten())))
        self.assertEqual(
            statement_text,
            """SELECT b FROM test
                WHERE abc=1 GROUP BY b ORDER BY b;""",
        )


class GetStatementPlaceholdersTestCase(TestCase):
    def test_no_with_statement(self):
        raw_query = """
            select * from test
        """
        statement = tokenize_by_statement(raw_query)[0]
        self.assertEqual(get_statement_placeholders(statement), [])

    def test_simple_with_statement(self):
        raw_query = """
            with abc as (
                select * from test
            )
            select * from abc
        """
        statement = tokenize_by_statement(raw_query)[0]
        self.assertEqual(get_statement_placeholders(statement), ["abc"])


class GetStatementSchemaTestCase(TestCase):
    def test_not_use_statement(self):
        raw_query = """
            select * from test
        """
        statement = tokenize_by_statement(raw_query)[0]
        self.assertEqual(get_statement_schema(statement, "default"), "default")

    def test_has_use_statement(self):
        raw_query = """
            use notdefault
        """
        statement = tokenize_by_statement(raw_query)[0]
        self.assertEqual(get_statement_schema(statement, "default"), "notdefault")


class GetTableStatementTypeTestCase(TestCase):
    def test_simple_statements(self):
        raw_query = """
            select * from test;
            create database test;
            use test;
            create table test.test (
                id int(11) not null,
                PRIMARY KEY (id)
            );
            alter table test add column username varchart(255);
            update table test.test set username = 'bob';
            drop table test;
            drop database test;
        """

        self.assertSequenceEqual(
            get_table_statement_type(raw_query),
            ["SELECT", None, None, "CREATE", "ALTER", "UPDATE", "DROP", None],
        )

    def test_special_cases(self):
        raw_query = """
            set hive.memory = 110G;
            with test as (
                select * from wasd
            )
            insert into b select * from test;
            explain select * from test;
        """
        self.assertSequenceEqual(
            get_table_statement_type(raw_query), [None, "INSERT", None]
        )
