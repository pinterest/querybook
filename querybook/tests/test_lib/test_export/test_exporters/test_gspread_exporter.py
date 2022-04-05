from unittest import TestCase, mock

from lib.export.exporters.gspread_exporter import (
    GoogleSheetsExporter,
    worksheet_coord_to_coord,
    coord_to_worksheet_coord,
)


class WorksheetCoordToCoordTestCase(TestCase):
    def test_simple(self):
        self.assertEqual(worksheet_coord_to_coord("A123"), (1, 123))
        self.assertEqual(worksheet_coord_to_coord("AA123"), (27, 123))
        self.assertEqual(worksheet_coord_to_coord("BA123"), (53, 123))

    def test_equivalent(self):
        cases = ["A123", "AA1234", "BA321", "DFA123", "AAA567", "ABC123"]
        for case in cases:
            self.assertEqual(
                coord_to_worksheet_coord(*worksheet_coord_to_coord(case)), case
            )


class CoordToWorksheetCoordTestCase(TestCase):
    def test_simple(self):
        self.assertEqual(coord_to_worksheet_coord(1, 1), "A1")
        self.assertEqual(coord_to_worksheet_coord(30, 20), "AD20")
        self.assertEqual(coord_to_worksheet_coord(52, 321), "AZ321")

    def test_equivalent(self):
        cases = range(1, 500, 7)
        for case in cases:
            self.assertEqual(
                worksheet_coord_to_coord(coord_to_worksheet_coord(case, 123)),
                (case, 123),
            )


class GetMaxRowsTestCase(TestCase):
    def setUp(self):
        create_google_flow_patch = mock.patch(
            "lib.export.exporters.gspread_exporter.create_google_flow"
        )
        self.addCleanup(create_google_flow_patch.stop)
        self.mock_create_google_flow = create_google_flow_patch.start()

        statement_columns_len_patch = mock.patch.object(
            GoogleSheetsExporter,
            "_get_statement_execution_num_cols",
            return_value=10,
        )
        self.addCleanup(statement_columns_len_patch.stop)
        self.statement_columns_len_mock = statement_columns_len_patch.start()

    def test_get_no_columns(self):
        # edge case - 0 columns (ie no statement results) shouldn't break this function
        self.statement_columns_len_mock.return_value = 0
        exporter = GoogleSheetsExporter({})
        try:
            self.assertNotEqual(exporter._get_max_rows(1), 0)
        except Exception:
            self.fail(
                "_get_max_rows raised an exception with 0 columns in statement execution result"
            )

    def test_column_offset(self):
        self.statement_columns_len_mock.return_value = 1000000
        exporter = GoogleSheetsExporter({})

        # 4 = 5000000 (max sheet cells) // 1000001
        self.assertEqual(exporter._get_max_rows(1, start_cell="A2"), 4)

    def test_row_offset(self):
        self.statement_columns_len_mock.return_value = 500000
        exporter = GoogleSheetsExporter({})

        # 8 = (5000000 [max sheet cells] // 500001) - 1
        self.assertEqual(exporter._get_max_rows(1, start_cell="B2"), 8)
