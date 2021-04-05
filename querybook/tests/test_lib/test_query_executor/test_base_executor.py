from unittest import TestCase
from lib.query_executor.base_executor import QueryExecutorBaseClass


class QueryExecutorBaseMatchTestCase(TestCase):
    def test_string_name(self):
        class TestEngine(QueryExecutorBaseClass):
            @classmethod
            def EXECUTOR_LANGUAGE(cls):
                return "English"

            @classmethod
            def EXECUTOR_NAME(cls):
                return "Test"

        self.assertTrue(TestEngine.match("English", "Test"))
        self.assertFalse(TestEngine.match("English", "Prod"))
        self.assertFalse(TestEngine.match("French", "Test"))

    def test_array_name(self):
        class TestEngine(QueryExecutorBaseClass):
            @classmethod
            def EXECUTOR_LANGUAGE(cls):
                return ["English", "French", "German"]

            @classmethod
            def EXECUTOR_NAME(cls):
                return "Test"

        self.assertTrue(TestEngine.match("English", "Test"))
        self.assertTrue(TestEngine.match("French", "Test"))
        self.assertFalse(TestEngine.match("English", "Prod"))
        self.assertFalse(TestEngine.match("Spanish", "Test"))
