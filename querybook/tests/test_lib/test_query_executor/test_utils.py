from unittest import TestCase

from const.query_execution import QueryExecutionErrorType
from lib.query_executor.exc import QueryExecutorException
from lib.query_executor.utils import (
    merge_str,
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


class FormatIfInternalErrorWithStackTraceTestCase(TestCase):
    def test_is_internal_error(self):
        self.assertEqual(
            format_if_internal_error_with_stack_trace(
                Exception(), QueryExecutionErrorType.INTERNAL.value, "Hello", "World"
            ),
            "Hello\nStack trace:\nWorld",
        )

        self.assertEqual(
            format_if_internal_error_with_stack_trace(
                Exception(), QueryExecutionErrorType.INTERNAL.value, None, "World"
            ),
            "\nStack trace:\nWorld",
        )

    def test_is_not_internal_error(self):
        self.assertEqual(
            format_if_internal_error_with_stack_trace(
                Exception(), QueryExecutionErrorType.ENGINE.value, "Hello", "World"
            ),
            "Hello",
        )

    def test_is_internal_but_recognizable_error(self):
        self.assertEqual(
            format_if_internal_error_with_stack_trace(
                QueryExecutorException(),
                QueryExecutionErrorType.INTERNAL.value,
                "Hello",
                "World",
            ),
            "Hello",
        )
