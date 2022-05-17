from unittest import TestCase
from lib.query_analysis.create_table.helper import is_custom_column_type
from lib.table_upload.common import UploadTableColumnType


class IsCustomColumnTypeTestCase(TestCase):
    def test_included_types(self):
        self.assertFalse(is_custom_column_type(UploadTableColumnType.INTEGER))
        self.assertFalse(is_custom_column_type(UploadTableColumnType.STRING))
        self.assertFalse(is_custom_column_type(UploadTableColumnType.FLOAT))
        self.assertFalse(is_custom_column_type(UploadTableColumnType.BOOLEAN))

    def test_custom_types(self):
        self.assertTrue(is_custom_column_type("ARRAY"))
        self.assertTrue(is_custom_column_type("VARCHAR(25)"))
        self.assertTrue(is_custom_column_type("CHAR(15)"))
