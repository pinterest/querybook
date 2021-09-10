from unittest import TestCase, mock
from datetime import datetime, date

from lib.query_analysis.templating import (
    LatestPartitionException,
    TemplatedQueryRenderer,
    UndefinedVariableException,
    QueryHasCycleException,
    QueryJinjaSyntaxException,
)


class DetectCycleTestCase(TestCase):
    def test_simple_no_cycle(self):
        dag = {"a": ["c"], "b": ["a"], "c": ["d"]}
        self.assertEqual(TemplatedQueryRenderer._detect_cycle(dag), False)

    def test_simple_cycle(self):
        dag = {"a": ["c"], "b": ["a"], "c": ["b"]}
        self.assertEqual(TemplatedQueryRenderer._detect_cycle(dag), True)

        dag = {"a": ["b"], "b": ["a"]}
        self.assertEqual(TemplatedQueryRenderer._detect_cycle(dag), True)

    def test_complex_no_cycle(self):
        dag = {
            "a": ["b", "c", "d"],
            "b": ["c", "d"],
            "c": ["e", "f", "g"],
            "d": [],
            "e": ["f", "g"],
            "f": ["g"],
        }
        self.assertEqual(TemplatedQueryRenderer._detect_cycle(dag), False)

    def test_complex_cycle(self):
        dag = {
            "a": ["b", "c", "d"],
            "b": ["c", "d"],
            "c": ["e", "f", "g"],
            "d": [],
            "e": ["f", "g"],
            "f": ["g"],
            "g": ["a"],
        }
        self.assertEqual(TemplatedQueryRenderer._detect_cycle(dag), True)


class GetTemplatedVariablesInStringTestCase(TestCase):
    def setUp(self):
        self.query_renderer = TemplatedQueryRenderer()

    def test_basic(self):
        self.assertEqual(
            self.query_renderer.get_templated_variables_in_string(
                "some random text {{ test }} some random text"
            ),
            set(["test"]),
        )

        self.assertEqual(
            self.query_renderer.get_templated_variables_in_string(
                "{{ test }} Some random text {{ another_test }}"
            ),
            set(["test", "another_test"]),
        )

        self.assertEqual(
            self.query_renderer.get_templated_variables_in_string(
                "{# some comments #}<b>{{name}}</b>"
            ),
            set(["name",]),
        )

    def test_nested(self):
        self.assertEqual(
            self.query_renderer.get_templated_variables_in_string(
                "{% set nums = [1,2,3] %}{% for i in nums %}{{ test }} Some random text {{ another_test }} {% endfor %}"
            ),
            set(["test", "another_test"]),
        )

        self.assertEqual(
            self.query_renderer.get_templated_variables_in_string(
                "{% for i in range(5) %}{{ test }} Some {{ another_test }}{% endfor %}"
            ),
            set(["test", "another_test"]),
        )


class FlattenRecursiveVariablesTestCase(TestCase):
    def setUp(self):
        self.query_renderer = TemplatedQueryRenderer()

    def test_simple(self):
        self.assertEqual(
            self.query_renderer.flatten_recursive_variables(
                {"foo": "{{ bar }}", "bar": "hello world", "baz": "foo"}
            ),
            ({"foo": "hello world", "bar": "hello world", "baz": "foo"}),
        )

        self.assertEqual(
            self.query_renderer.flatten_recursive_variables(
                {"foo": "{{ bar }}", "bar": "hello world", "baz": None}
            ),
            ({"foo": "hello world", "bar": "hello world", "baz": ""}),
        )

    def test_complex(self):
        self.assertEqual(
            self.query_renderer.flatten_recursive_variables(
                {
                    "foo": "{{ bar }}",
                    "bar": "hello {{ baz }}",
                    "baz": "world{{end}}",
                    "end": "!",
                }
            ),
            (
                {
                    "foo": "hello world!",
                    "bar": "hello world!",
                    "baz": "world!",
                    "end": "!",
                }
            ),
        )

    def test_has_cycle(self):
        self.assertRaises(
            QueryHasCycleException,
            self.query_renderer.flatten_recursive_variables,
            {"foo": "{{ bar }}", "bar": "{{ foo }}", "baz": "hello world"},
        )

    def test_undefined_var(self):
        self.assertRaises(
            UndefinedVariableException,
            self.query_renderer.flatten_recursive_variables,
            {"foo": "{{ bar }}", "bar": "{{ baz }}", "baz": "{{ boo }}"},
        )


class RenderTemplatedQueryTestCase(TestCase):
    def setUp(self):
        self.query_renderer = TemplatedQueryRenderer()

    def test_basic(self):
        query = 'select * from table where dt="{{ date }}"'
        variable = {"date": "1970-01-01"}
        self.assertEqual(
            self.query_renderer.render_templated_query(query, variable),
            'select * from table where dt="1970-01-01"',
        )

    def test_recursion(self):
        query = 'select * from table where dt="{{ date }}"'
        variable = {
            "date": "{{ date2 }}",
            "date2": "1970-{{ date3 }}-01",
            "date3": "01",
        }
        self.assertEqual(
            self.query_renderer.render_templated_query(query, variable),
            'select * from table where dt="1970-01-01"',
        )

    def test_global_vars(self):
        datetime_mock = mock.Mock(wraps=datetime)
        datetime_mock.today.return_value = date(1970, 1, 1)
        with mock.patch("lib.query_analysis.templating.datetime", new=datetime_mock):
            query = 'select * from table where dt="{{ date }}"'
            self.assertEqual(
                self.query_renderer.render_templated_query(
                    query, {"date": "{{ today }}"}
                ),
                'select * from table where dt="1970-01-01"',
            )

    def test_exception(self):
        # Missing variable
        self.assertRaises(
            UndefinedVariableException,
            self.query_renderer.render_templated_query,
            'select * from {{ table }} where dt="{{ date }}"',
            {"table": "foo"},
        )

        # Missing variable but recursive
        self.assertRaises(
            UndefinedVariableException,
            self.query_renderer.render_templated_query,
            'select * from {{ table }} where dt="{{ date }}"',
            {"table": "foo", "date": "{{ bar }}"},
        )

        # Circular dependency
        self.assertRaises(
            QueryHasCycleException,
            self.query_renderer.render_templated_query,
            'select * from {{ table }} where dt="{{ date }}"',
            {"date": "{{ date2 }}", "date2": "{{ date }}"},
        )

        # Invalid template usage
        self.assertRaises(
            QueryJinjaSyntaxException,
            self.query_renderer.render_templated_query,
            'select * from {{ table  where dt="{{ date }}"',
            {"table": "foo", "date": "{{ bar }}"},
        )

    def test_escape_comments(self):
        query = """select * from
-- {{ end_date }}
/* {{ end_date }} */
sample_table limit 5;
-- '{{ end_date }}'
/*
    {{ end_date}}
    {{ end_date}}
*/
/*
{{ end_date}}*/
-- {{ end_date }}"""
        self.assertEqual(self.query_renderer.render_templated_query(query, {}), query)

    def test_escape_comments_non_greedy(self):
        query_non_greedy = """select * from
/*
   {{ end_date }}
*/
{{ test }}
/*
   {{ end_date2 }}
*/
"""
        self.assertEqual(
            self.query_renderer.render_templated_query(
                query_non_greedy, {"test": "render"}
            ),
            """select * from
/*
   {{ end_date }}
*/
render
/*
   {{ end_date2 }}
*/""",
        )


class EscapeSQLCommentsTestCase(TestCase):
    def test_single_line(self):
        self.assertEqual(
            TemplatedQueryRenderer._escape_sql_comments("select 1 -- test"),
            'select 1 {{ "-- test" }}',
        )

    def test_multi_line(self):
        self.assertEqual(
            TemplatedQueryRenderer._escape_sql_comments("select 1 \n/* \ntest\n */"),
            'select 1 \n{{ "/* \\ntest\\n */" }}',
        )

    def test_no_backtracking(self):
        # This query caused catastrophic backtracking, adding it as
        # test case to ensure it doesn't happen in future
        query = """
WITH a AS (
  SELECT
  COALESCE(get_json(json, 'a.id'), 0) AS aid,
  get_json(json, 'b') AS b,
  MAX(if(TRANSLATE(COALESCE(LOWER(TRANSLATE(get_json_object(json, '$.b.c'), ' ', '')), ''), '|', '-') = 'e', 1, 0)) AS e,
  MAX(if(TRANSLATE(COALESCE(LOWER(TRANSLATE(get_json_object(json, '$.f.g'), ' ', '')), ''), '|', '-') like '%h%', 1, 0)) AS h

  FROM i.j
  WHERE h = '2020-01-01'
  AND get_json(json, 'i') RLIKE '/j/(k|l|m|n)/*'
  group by 1, 2
)

SELECT * FROM (
SELECT
   a,
   SUM(b) as b_sum,
   SUM(c) as c_sum,
   SUM(1) as num_sum,
   SUM(d) / SUM(1) as frac_d,
   SUM(e) / SUM(1) as frac_e
FROM f
GROUP BY 1
)
WHERE a > 20
AND b > 0.8
order by c DESC
limit 100"""
        self.assertEqual(TemplatedQueryRenderer._escape_sql_comments(query), query)


class LatestPartitionTestCase(TestCase):
    def setUp(self):
        self.engine_mock = mock.Mock()
        self.engine_mock.metastore_id = 2  # arbitrary metastore_id
        get_query_engine_by_id_patch = mock.patch("logic.admin.get_query_engine_by_id")
        self.get_query_engine_by_id_mock = get_query_engine_by_id_patch.start()
        self.addCleanup(get_query_engine_by_id_patch.stop)
        self.get_query_engine_by_id_mock.return_value = self.engine_mock

        self.metastore_loader_mock = mock.Mock()
        self.metastore_loader_mock.get_latest_partition.return_value = "dt=2021-01-01"
        get_metastore_loader_patch = mock.patch("lib.metastore.get_metastore_loader")
        self.get_metastore_loader_mock = get_metastore_loader_patch.start()
        self.addCleanup(get_metastore_loader_patch.stop)
        self.get_metastore_loader_mock.return_value = self.metastore_loader_mock

        self.query_renderer = TemplatedQueryRenderer(1)

    def test_invalid_engine_id(self):
        self.get_query_engine_by_id_mock.return_value = None
        # Need to create new query_renderer to recreate `get_latest_partition` function in constructor
        # to apply new mock return value above
        query_renderer = TemplatedQueryRenderer()
        self.assertRaises(
            LatestPartitionException,
            query_renderer.render_templated_query,
            'select * from table where dt="{{ latest_partition("default.table", "dt") }}"',
            {},
        )

    def test_invalid_table_name(self):
        self.assertRaises(
            LatestPartitionException,
            self.query_renderer.render_templated_query,
            'select * from table where dt="{{ latest_partition("table", "dt") }}"',
            {},
        )

    def test_invalid_partition_name(self):
        self.assertRaises(
            LatestPartitionException,
            self.query_renderer.render_templated_query,
            'select * from table where dt="{{ latest_partition("default.table", "date") }}"',
            {},
        )

    def test_no_latest_partition(self):
        self.metastore_loader_mock.get_latest_partition.return_value = None
        self.assertRaises(
            LatestPartitionException,
            self.query_renderer.render_templated_query,
            'select * from table where dt="{{ latest_partition("default.table", "dt") }}"',
            {},
        )

    def test_multiple_partition_columns(self):
        self.metastore_loader_mock.get_latest_partition.return_value = (
            "dt=2021-01-01/hr=01"
        )
        get_latest_partition = self.query_renderer.create_get_latest_partition()
        latest_partition = get_latest_partition("default.table", "dt")
        self.assertEqual(latest_partition, "2021-01-01")

        latest_partition = get_latest_partition("default.table", "hr")
        self.assertEqual(latest_partition, "01")

    def test_single_partition_column(self):
        latest_partition = self.query_renderer.create_get_latest_partition()(
            "default.table", "dt"
        )
        self.assertEqual(latest_partition, "2021-01-01")

    def test_render_templated_query(self):
        templated_query = self.query_renderer.render_templated_query(
            'select * from table where dt="{{ latest_partition("default.table", "dt") }}"',
            {},
        )
        self.assertEqual(
            templated_query, 'select * from table where dt="2021-01-01"',
        )
