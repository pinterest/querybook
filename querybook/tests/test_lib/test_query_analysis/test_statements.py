from unittest import TestCase
from lib.query_analysis.statements import (
    get_statement_ranges,
    get_query_lines,
    index_to_line_ch_pos,
)


class GetStatementRangesTestCase(TestCase):
    def test_single_statement(self):
        self.assertListEqual(get_statement_ranges("select 1"), [(0, 8)])
        self.assertListEqual(get_statement_ranges("select 1; --boo"), [(0, 8)])
        self.assertListEqual(get_statement_ranges("select --boo\n1"), [(0, 14)])

    def test_multi_statements(self):
        self.assertListEqual(
            get_statement_ranges("select 1; select 2"), [(0, 8), (10, 18)]
        )
        self.assertListEqual(
            get_statement_ranges("select 1; --boo\nselect 2;"), [(0, 8), (16, 24)]
        )


class GetQueryLinesTestCase(TestCase):
    def test_single_line(self):
        self.assertListEqual(get_query_lines("s"), [0, 2])
        self.assertListEqual(get_query_lines("select 1"), [0, 9])
        self.assertListEqual(get_query_lines("select 1;"), [0, 10])

    def test_multi_lines(self):
        self.assertListEqual(
            get_query_lines("select 1;\nselect 2;\nselect 3;"), [0, 10, 20, 30]
        )
        self.assertListEqual(get_query_lines("a\nb\nc"), [0, 2, 4, 6])


class IndexToLineChPosTestCase(TestCase):
    def test_single_line(self):
        query_lines = [0, 9]  # select 1
        self.assertTupleEqual(index_to_line_ch_pos(query_lines, 5), (0, 5))
        self.assertTupleEqual(index_to_line_ch_pos(query_lines, 2), (0, 2))

    def test_multi_lines(self):
        query_lines = [0, 10, 20, 30]  # "select 1;\nselect 2;\nselect 3;"
        self.assertTupleEqual(index_to_line_ch_pos(query_lines, 12), (1, 2))
        self.assertTupleEqual(index_to_line_ch_pos(query_lines, 5), (0, 5))
        self.assertTupleEqual(index_to_line_ch_pos(query_lines, 22), (2, 2))

    def test_out_of_bound(self):
        query_lines = [0, 10, 20, 30]  # "select 1;\nselect 2;\nselect 3;"
        self.assertTupleEqual(index_to_line_ch_pos(query_lines, 30), (3, 0))
        self.assertTupleEqual(index_to_line_ch_pos(query_lines, 35), (3, 5))
