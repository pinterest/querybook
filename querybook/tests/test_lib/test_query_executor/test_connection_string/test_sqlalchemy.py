from unittest import TestCase
from lib.query_executor.connection_string.sqlalchemy import (
    _get_sqlalchemy_create_engine_kwargs,
)


class CreateEngineKwargsTestCase(TestCase):
    def test_empty(self):
        self.assertEqual(_get_sqlalchemy_create_engine_kwargs({}), ("", {}))
        self.assertEqual(
            _get_sqlalchemy_create_engine_kwargs({"connection_string": "foobar"}),
            ("foobar", {}),
        )
        self.assertEqual(
            _get_sqlalchemy_create_engine_kwargs(
                {"connection_string": "foobar", "connect_args": []}
            ),
            ("foobar", {}),
        )

    def test_simple_connect_args(self):
        self.assertEqual(
            _get_sqlalchemy_create_engine_kwargs(
                {
                    "connection_string": "foobar",
                    "connect_args": [
                        {"key": "foo", "value": "bar", "isJson": False},
                        {"key": "hello", "value": "world"},
                    ],
                }
            ),
            ("foobar", {"foo": "bar", "hello": "world"}),
        )

        self.assertEqual(
            _get_sqlalchemy_create_engine_kwargs(
                {
                    "connection_string": "foobar",
                    "connect_args": [
                        {"key": "foo", "value": "bar", "isJson": False},
                        {"key": "foo", "value": "baz", "isJson": False},
                    ],
                }
            ),
            ("foobar", {"foo": "baz"}),
        )

    def test_json_connect_args(self):
        self.assertEqual(
            _get_sqlalchemy_create_engine_kwargs(
                {
                    "connection_string": "foobar",
                    "connect_args": [
                        {"key": "hello", "value": '"world"', "isJson": True},
                        {"key": "foo", "value": "1", "isJson": True},
                        {"key": "bar", "value": '["test"]', "isJson": True},
                        {"key": "baz", "value": '{"a": "b"}', "isJson": True},
                    ],
                }
            ),
            (
                "foobar",
                {"hello": "world", "foo": 1, "bar": ["test"], "baz": {"a": "b"}},
            ),
        )

    def test_error_conect_args(self):
        self.assertEqual(
            _get_sqlalchemy_create_engine_kwargs(
                {
                    "connection_string": "foobar",
                    "connect_args": [
                        # Value Missing
                        {"key": "foo", "isJson": True},
                        # Key Missing
                        {"value": "['test']", "isJson": True},
                        # Invalid JSON
                        {"key": "baz", "value": "{'a': 'b'}", "isJson": True},
                        # Still Works
                        {"key": "hello", "value": '"world"', "isJson": True},
                    ],
                }
            ),
            ("foobar", {"hello": "world"}),
        )
