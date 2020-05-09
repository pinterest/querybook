from unittest import TestCase, mock
from datetime import datetime, date

from lib.query_analysis.templating import (
    _detect_cycle,
    get_templated_variables_in_string,
    separate_variable_and_partials,
    render_templated_query,
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
                "{{ test }} Some random text {{ another_test }}"
            ),
            set(["test", "another_test"]),
        )

        self.assertEqual(
            get_templated_variables_in_string(
                "{{> test }} Some random text {{ another_test }}"
            ),
            set(["test", "another_test"]),
        )

        self.assertEqual(
            get_templated_variables_in_string(
                "{{> test }} Some random {{test2}} text {{! another_test }}"
            ),
            set(["test", "test2"]),
        )

    def test_nested(self):
        self.assertEqual(
            get_templated_variables_in_string(
                "{{# section }}{{ test }} Some random text {{ another_test }}{{/section}}"
            ),
            set(["section", "test", "another_test"]),
        )

        self.assertEqual(
            get_templated_variables_in_string(
                "{{# section }}{{ test }} Some {{# section2 }}random{{/ section2 }} text {{ another_test }}{{/section}}"
            ),
            set(["section", "section2", "test", "another_test"]),
        )
        self.assertEqual(
            get_templated_variables_in_string(
                "{{#repos}}<b>{{name}}</b>{{/repos}} {{^repos}}No repos : {{value}}({{/repos}}"
            ),
            set(["repos", "name", "value"]),
        )


class SeparateVariablesAndPartialsTestCase(TestCase):
    def test_simple(self):
        self.assertEqual(
            separate_variable_and_partials(
                {"foo": "{{ bar }}", "bar": "hello world", "baz": "foo"}
            ),
            ({"bar": "hello world", "baz": "foo"}, {"foo": "{{ bar }}"}),
        )

        self.assertEqual(
            separate_variable_and_partials(
                {"foo": "{{ bar }}", "bar": "hello world", "baz": None}
            ),
            ({"bar": "hello world", "baz": ""}, {"foo": "{{ bar }}"}),
        )

    def test_has_cycle(self):
        self.assertRaises(
            Exception,
            separate_variable_and_partials,
            {"foo": "{{ bar }}", "bar": "{{ foo }}", "baz": "hello world"},
        )


class RenderTemplatedQuery(TestCase):
    def test_basic(self):
        query = 'select * from table where dt="{{ date }}"'
        variable = {"date": "1970-01-01"}
        self.assertEqual(
            render_templated_query(query, variable),
            'select * from table where dt="1970-01-01"',
        )

    def test_recursion(self):
        query = 'select * from table where dt="{{> date }}"'
        variable = {
            "date": "{{ date2 }}",
            "date2": "1970-01-01",
        }
        self.assertEqual(
            render_templated_query(query, variable),
            'select * from table where dt="1970-01-01"',
        )

    def test_global_vars(self):
        datetime_mock = mock.Mock(wraps=datetime)
        datetime_mock.today.return_value = date(1970, 1, 1)
        with mock.patch("lib.query_analysis.templating.datetime", new=datetime_mock):
            query = 'select * from table where dt="{{> date }}"'
            self.assertEqual(
                render_templated_query(query, {"date": "{{ today }}"}),
                'select * from table where dt="1970-01-01"',
            )

    def test_exception(self):
        # Missing variable
        self.assertRaises(
            Exception,
            render_templated_query,
            'select * from {{ table }} where dt="{{ date }}"',
            {"table": "foo"},
        )

        # Circular dependency
        self.assertRaises(
            Exception,
            render_templated_query,
            'select * from {{ table }} where dt="{{> date }}"',
            {"date": "{{> date2 }}", "date2": "{{> date }}"},
        )
