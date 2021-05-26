from unittest import TestCase
import datetime

from const.query_execution import QueryExecutionErrorType
from lib.query_executor.utils import (
    merge_str,
    serialize_cell,
    row_to_csv,
    format_if_internal_error_with_stack_trace,
)


class MergeStringTestCase(TestCase):
    def test_both_not_empty(self):
        self.assertEqual(merge_str("hello", "world", " "), "hello world")
        self.assertEqual(merge_str("left", "right", ","), "left,right")

    def test_one_empty(self):
        self.assertEqual(merge_str("", "hello"), "hello")
        self.assertEqual(merge_str("hello", ""), "hello")
        self.assertEqual(merge_str("", ""), "")


class SerializeCellTestCase(TestCase):
    def test_simple_values(self):
        self.assertEqual(serialize_cell("hello"), "hello")
        self.assertEqual(serialize_cell(123), "123")
        self.assertEqual(serialize_cell(0.5), "0.5")

    def test_complex_values(self):
        # This is to test the serialization would work
        # for arrays and dictionaries

        self.assertEqual(serialize_cell({}), "{}")
        self.assertEqual(serialize_cell([]), "[]")
        self.assertEqual(serialize_cell([123, 456]), "[123, 456]")

    def test_datetime(self):
        test_date = datetime.date(2020, 1, 2)
        test_datetime = datetime.datetime(2020, 1, 2, 3, 4, 5)
        self.assertEqual(serialize_cell(test_date), "2020-01-02")
        self.assertEqual(serialize_cell(test_datetime), "2020-01-02T03:04:05")


class RowToCSVTestCase(TestCase):
    def test_simple_case(self):
        row = ["Hello World", 1234, 0.5, "中文"]
        self.assertEqual(row_to_csv(row), "Hello World,1234,0.5,中文\n")

    def test_json_case(self):
        row = ["Hello", [], {}]
        self.assertEqual(row_to_csv(row), "Hello,[],{}\n")

    def test_string_escape(self):
        multiline_row = [123, "Hello\nWorld", 123]
        self.assertEqual(row_to_csv(multiline_row), '123,"Hello\nWorld",123\n')

        comma_row = [123, "Hello,World", 123]
        self.assertEqual(row_to_csv(comma_row), '123,"Hello,World",123\n')

        quote_row = [123, 'Hello"World', 123]
        self.assertEqual(row_to_csv(quote_row), '123,"Hello""World",123\n')


class FormatIfInternalErrorWithStackTraceTestCase(TestCase):
    def test_is_internal_error(self):
        self.assertEqual(
            format_if_internal_error_with_stack_trace(
                QueryExecutionErrorType.INTERNAL.value, "Hello", "World"
            ),
            "Hello\nStack trace:\nWorld",
        )

        self.assertEqual(
            format_if_internal_error_with_stack_trace(
                QueryExecutionErrorType.INTERNAL.value, None, "World"
            ),
            "\nStack trace:\nWorld",
        )

    def test_is_not_internal_error(self):
        self.assertEqual(
            format_if_internal_error_with_stack_trace(
                QueryExecutionErrorType.ENGINE.value, "Hello", "World"
            ),
            "Hello",
        )
