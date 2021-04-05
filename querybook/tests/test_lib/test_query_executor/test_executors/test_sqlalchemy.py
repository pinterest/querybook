from unittest import TestCase
from lib.query_executor.executors.sqlalchemy import is_dialect_available


class IsDialectAvailableTestCase(TestCase):
    def test_existing_dialect(self):
        # We can guarantee sqlite should be always available
        self.assertTrue(is_dialect_available("sqlite"))

    def test_non_existent_dialect(self):
        self.assertFalse(is_dialect_available("fakeMysql"))
