from unittest import TestCase, mock
from datetime import datetime, date

from lib.query_analysis.templating import (
    _detect_cycle,
    _escape_sql_comments,
    get_templated_variables_in_string,
    render_templated_query,
    flatten_recursive_variables,
    UndefinedVariableException,
    QueryHasCycleException,
    QueryJinjaSyntaxException,
)


class DetectCycleTestCase(TestCase):
    def test_simple_no_cycle(self):
        dag = {"a": ["c"], "b": ["a"], "c": ["d"]}
        self.assertEqual(_detect_cycle(dag), False)

    def test_simple_cycle(self):
        dag = {"a": ["c"], "b": ["a"], "c": ["b"]}
        self.assertEqual(_detect_cycle(dag), True)

        dag = {"a": ["b"], "b": ["a"]}
        self.assertEqual(_detect_cycle(dag), True)

    def test_complex_no_cycle(self):
        dag = {
            "a": ["b", "c", "d"],
            "b": ["c", "d"],
            "c": ["e", "f", "g"],
            "d": [],
            "e": ["f", "g"],
            "f": ["g"],
        }
        self.assertEqual(_detect_cycle(dag), False)

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
        self.assertEqual(_detect_cycle(dag), True)


class GetTemplatedVariablesInStringTestCase(TestCase):
    def test_basic(self):
        self.assertEqual(
            get_templated_variables_in_string(
                "some random text {{ test }} some random text"
            ),
            set(["test"]),
        )

        self.assertEqual(
            get_templated_variables_in_string(
                "{{ test }} Some random text {{ another_test }}"
            ),
            set(["test", "another_test"]),
        )

        self.assertEqual(
            get_templated_variables_in_string("{# some comments #}<b>{{name}}</b>"),
            set(["name",]),
        )

    def test_nested(self):
        self.assertEqual(
            get_templated_variables_in_string(
                "{% set nums = [1,2,3] %}{% for i in nums %}{{ test }} Some random text {{ another_test }} {% endfor %}"
            ),
            set(["test", "another_test"]),
        )

        self.assertEqual(
            get_templated_variables_in_string(
                "{% for i in range(5) %}{{ test }} Some {{ another_test }}{% endfor %}"
            ),
            set(["test", "another_test"]),
        )


class FlattenRecursiveVariablesTestCase(TestCase):
    def test_simple(self):
        self.assertEqual(
            flatten_recursive_variables(
                {"foo": "{{ bar }}", "bar": "hello world", "baz": "foo"}
            ),
            ({"foo": "hello world", "bar": "hello world", "baz": "foo"}),
        )

        self.assertEqual(
            flatten_recursive_variables(
                {"foo": "{{ bar }}", "bar": "hello world", "baz": None}
            ),
            ({"foo": "hello world", "bar": "hello world", "baz": ""}),
        )

    def test_complex(self):
        self.assertEqual(
            flatten_recursive_variables(
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
            flatten_recursive_variables,
            {"foo": "{{ bar }}", "bar": "{{ foo }}", "baz": "hello world"},
        )

    def test_undefined_var(self):
        self.assertRaises(
            UndefinedVariableException,
            flatten_recursive_variables,
            {"foo": "{{ bar }}", "bar": "{{ baz }}", "baz": "{{ boo }}"},
        )


class RenderTemplatedQueryTestCase(TestCase):
    def test_basic(self):
        query = 'select * from table where dt="{{ date }}"'
        variable = {"date": "1970-01-01"}
        self.assertEqual(
            render_templated_query(query, variable),
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
            render_templated_query(query, variable),
            'select * from table where dt="1970-01-01"',
        )

    def test_global_vars(self):
        datetime_mock = mock.Mock(wraps=datetime)
        datetime_mock.today.return_value = date(1970, 1, 1)
        with mock.patch("lib.query_analysis.templating.datetime", new=datetime_mock):
            query = 'select * from table where dt="{{ date }}"'
            self.assertEqual(
                render_templated_query(query, {"date": "{{ today }}"}),
                'select * from table where dt="1970-01-01"',
            )

    def test_exception(self):
        # Missing variable
        self.assertRaises(
            UndefinedVariableException,
            render_templated_query,
            'select * from {{ table }} where dt="{{ date }}"',
            {"table": "foo"},
        )

        # Missing variable but recursive
        self.assertRaises(
            UndefinedVariableException,
            render_templated_query,
            'select * from {{ table }} where dt="{{ date }}"',
            {"table": "foo", "date": "{{ bar }}"},
        )

        # Circular dependency
        self.assertRaises(
            QueryHasCycleException,
            render_templated_query,
            'select * from {{ table }} where dt="{{ date }}"',
            {"date": "{{ date2 }}", "date2": "{{ date }}"},
        )

        # Invalid template usage
        self.assertRaises(
            QueryJinjaSyntaxException,
            render_templated_query,
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
        self.assertEqual(render_templated_query(query, {}), query)

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
            render_templated_query(query_non_greedy, {"test": "render"}),
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
            _escape_sql_comments("select 1 -- test"), 'select 1 {{ "-- test" }}'
        )

    def test_multi_line(self):
        self.assertEqual(
            _escape_sql_comments("select 1 \n/* \ntest\n */"),
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
        self.assertEqual(_escape_sql_comments(query), query)
