from unittest import TestCase, mock
from lib.query_executor.base_executor import QueryExecutorBaseClass
from lib.query_executor import all_executors


class GetFlattenedExecutorTestCase(TestCase):
    def setUp(self):
        class TestEngine(QueryExecutorBaseClass):
            @classmethod
            def EXECUTOR_LANGUAGE(cls):
                return "English"

            @classmethod
            def EXECUTOR_NAME(cls):
                return "Test"

            @classmethod
            def EXECUTOR_TEMPLATE(cls):
                return None

        class Test2Engine(QueryExecutorBaseClass):
            @classmethod
            def EXECUTOR_LANGUAGE(cls):
                return ["English", "French", "Spanish"]

            @classmethod
            def EXECUTOR_NAME(cls):
                return "Test2"

            @classmethod
            def EXECUTOR_TEMPLATE(cls):
                return None

        self.mock_all_executors = mock.patch(
            "lib.query_executor.all_executors.ALL_EXECUTORS",
            [TestEngine, Test2Engine],
        )

    def test_flatten_engines(self):
        with self.mock_all_executors:
            self.assertEqual(
                all_executors.get_flattened_executor_template(),
                [
                    {"language": "English", "name": "Test", "template": None},
                    {"language": "English", "name": "Test2", "template": None},
                    {"language": "French", "name": "Test2", "template": None},
                    {"language": "Spanish", "name": "Test2", "template": None},
                ],
            )


class GetExecutorClassTestCase(TestCase):
    def setUp(self):
        class TestEngine(QueryExecutorBaseClass):
            @classmethod
            def EXECUTOR_LANGUAGE(cls):
                return "English"

            @classmethod
            def EXECUTOR_NAME(cls):
                return "Test"

            @classmethod
            def EXECUTOR_TEMPLATE(cls):
                return None

        class Test2Engine(QueryExecutorBaseClass):
            @classmethod
            def EXECUTOR_LANGUAGE(cls):
                return ["English", "French", "Spanish"]

            @classmethod
            def EXECUTOR_NAME(cls):
                return "Test2"

            @classmethod
            def EXECUTOR_TEMPLATE(cls):
                return None

        self.mock_all_executors = mock.patch(
            "lib.query_executor.all_executors.ALL_EXECUTORS",
            [TestEngine, Test2Engine],
        )

    def test_get_executor_class(self):
        with self.mock_all_executors:
            test_engine, test2_engine = all_executors.ALL_EXECUTORS
            self.assertEqual(
                all_executors.get_executor_class("English", "Test"),
                test_engine,
            )
            self.assertEqual(
                all_executors.get_executor_class("English", "Test2"),
                test2_engine,
            )
            self.assertEqual(
                all_executors.get_executor_class("French", "Test2"),
                test2_engine,
            )
