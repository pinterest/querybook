from tempfile import TemporaryFile
from unittest import TestCase
import pandas as pd
from pandas.testing import assert_frame_equal

from lib.table_upload.common import UploadTableColumnType
from lib.table_upload.importer.csv_file_importer import CSVFileImporter

data = pd.DataFrame(
    {
        "id": [1, 2, 3, 4],
        "col1": ["hello", "world", "foo", "bar"],
        "col2": [1, 1, 1, 0],
        "col3": ["2019-08-17", "2020-06-04", "2021-12-25", "2021-04-19"],
    }
)


class CSVFileImporterTestCase(TestCase):
    def setUp(self):
        self.tempfile = TemporaryFile(mode="w+")
        self.tempfile.write(data.to_csv(index=False))
        self.tempfile.seek(0)

        self.import_config = {
            "delimiter": ",",
            "first_row_column": True,
            "skip_rows": 0,
            "skip_blank_lines": True,
            "max_rows": None,
            "skip_initial_space": True,
        }

    def tearDown(self):
        self.tempfile.close()

    def test_get_df(self):
        importer = CSVFileImporter(self.tempfile, self.import_config)
        assert_frame_equal(importer.get_pandas_df(), data)

    def test_get_cols(self):
        importer = CSVFileImporter(self.tempfile, self.import_config)
        self.assertEqual(
            importer.get_columns(),
            [
                ("id", UploadTableColumnType.INTEGER),
                ("col1", UploadTableColumnType.STRING),
                ("col2", UploadTableColumnType.INTEGER),
                ("col3", UploadTableColumnType.STRING),
            ],
        )
