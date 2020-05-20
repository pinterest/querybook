from unittest import TestCase

from lib.export.exporters.gspread_exporter import (
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
