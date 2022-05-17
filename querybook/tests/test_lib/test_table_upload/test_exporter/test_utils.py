from unittest import TestCase

import pandas as pd
from pandas.testing import assert_frame_equal
from lib.table_upload.common import UploadTableColumnType
from lib.table_upload.exporter.utils import update_pandas_df_column_name_type


class UpdatePandasDFTestCase(TestCase):
    def setUp(self) -> None:
        self.df = pd.DataFrame(
            {
                "id": [1, 2, 3, 4],
                "col1": ["1", "2", "3", "4"],
                "col2": [1, 1, 1, 0],
                "col3": ["2019-08-17", "2020-06-04", "2021-12-25", "2021-04-19"],
            }
        )

    def test_noop(self):
        df = update_pandas_df_column_name_type(
            self.df,
            [
                ("id", UploadTableColumnType.INTEGER),
                ("col1", UploadTableColumnType.STRING),
                ("col2", UploadTableColumnType.INTEGER),
                ("col3", UploadTableColumnType.STRING),
            ],
        )
        assert_frame_equal(
            df,
            pd.DataFrame(
                {
                    "id": [1, 2, 3, 4],
                    "col1": ["1", "2", "3", "4"],
                    "col2": [1, 1, 1, 0],
                    "col3": ["2019-08-17", "2020-06-04", "2021-12-25", "2021-04-19"],
                }
            ),
        )

    def test_cast_types_and_rename(self):
        df = update_pandas_df_column_name_type(
            self.df,
            [
                ("id", UploadTableColumnType.STRING),
                ("new_col1", UploadTableColumnType.INTEGER),
                ("new_col2", UploadTableColumnType.BOOLEAN),
                ("new_col3", UploadTableColumnType.DATETIME),
            ],
        )
        assert_frame_equal(
            df,
            pd.DataFrame(
                {
                    "id": ["1", "2", "3", "4"],
                    "new_col1": [1, 2, 3, 4],
                    "new_col2": [True, True, True, False],
                    "new_col3": [
                        pd.Timestamp("2019-08-17"),
                        pd.Timestamp("2020-06-04"),
                        pd.Timestamp("2021-12-25"),
                        pd.Timestamp("2021-04-19"),
                    ],
                }
            ),
        )

    def test_no_cast_for_custom_type(self):

        df = update_pandas_df_column_name_type(
            self.df,
            [
                ("id", UploadTableColumnType.INTEGER),
                ("col1", UploadTableColumnType.INTEGER),  # This is casted
                ("col2", "CUSTOM_TYPE"),  # This should be skipped
                ("col3", UploadTableColumnType.STRING),
            ],
        )
        assert_frame_equal(
            df,
            pd.DataFrame(
                {
                    "id": [1, 2, 3, 4],
                    "col1": [1, 2, 3, 4],
                    "col2": [1, 1, 1, 0],
                    "col3": ["2019-08-17", "2020-06-04", "2021-12-25", "2021-04-19"],
                }
            ),
        )
