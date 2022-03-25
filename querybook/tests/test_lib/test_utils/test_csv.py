import datetime
from unittest import TestCase

from lib.utils.csv import serialize_cell, row_to_csv, csv_sniffer, split_csv_to_chunks


class SerializeCellTestCase(TestCase):
    def test_simple_values(self):
        self.assertEqual(serialize_cell("hello"), "hello")
        self.assertEqual(serialize_cell(123), "123")
        self.assertEqual(serialize_cell(0.5), "0.5")

    def test_complex_values(self):
        # This is to test the serialization would work
        # for arrays and dictionaries

        self.assertEqual(serialize_cell({}), "{}")
        self.assertEqual(serialize_cell([]), "[]")
        self.assertEqual(serialize_cell([123, 456]), "[123, 456]")

    def test_datetime(self):
        test_date = datetime.date(2020, 1, 2)
        test_datetime = datetime.datetime(2020, 1, 2, 3, 4, 5)
        self.assertEqual(serialize_cell(test_date), "2020-01-02")
        self.assertEqual(serialize_cell(test_datetime), "2020-01-02T03:04:05")


class RowToCSVTestCase(TestCase):
    def test_simple_case(self):
        row = ["Hello World", 1234, 0.5, "中文"]
        self.assertEqual(row_to_csv(row), "Hello World,1234,0.5,中文\n")

    def test_json_case(self):
        row = ["Hello", [], {}]
        self.assertEqual(row_to_csv(row), "Hello,[],{}\n")

    def test_string_escape(self):
        multiline_row = [123, "Hello\nWorld", 123]
        self.assertEqual(row_to_csv(multiline_row), '123,"Hello\nWorld",123\n')

        comma_row = [123, "Hello,World", 123]
        self.assertEqual(row_to_csv(comma_row), '123,"Hello,World",123\n')

        quote_row = [123, 'Hello"World', 123]
        self.assertEqual(row_to_csv(quote_row), '123,"Hello""World",123\n')


class CSVSnifferTestCase(TestCase):
    def test_simple_csv(self):
        data = ["foo,bar", '"1", """"', '3, "4"""']
        self.assertEqual(csv_sniffer(data), 2)

    def test_simple_csv_with_new_line(self):
        data = ["foo,bar", '"', '1", """', '"', '3, "4"""']  # Line start  # Line End

        self.assertEqual(csv_sniffer(data), 4)

    def test_last_line_invalid(self):
        data = ["foo,bar", '"1", """"', '3, "']
        self.assertEqual(csv_sniffer(data), 1)

    def test_multi_invalid_lines(self):
        data = [
            "foo,bar",
            '"1", """"',
            '3, "',  # Cell start
            '4, 5, 6 ""',
            "7, 8, 9",  # Cell continued
        ]
        self.assertEqual(csv_sniffer(data), 1)

    def test_entire_partial_csv(self):
        data = ['foo, "bar ,', '"" baz ,', "boo"]
        self.assertIsNone(csv_sniffer(data))

    def test_invalid_csv(self):
        data = ["foo, bar", "1, 2,3"]
        with self.assertRaises(ValueError):
            csv_sniffer(data)


class SplitCSVToChunksTestCase(TestCase):
    def test_simple_csv(self):
        data = ["foo,bar", '"1", """"', '3, "4"""']
        self.assertEqual(split_csv_to_chunks(data), (data, []))

    def test_simple_csv_partial(self):
        data = ["foo,bar", '"1", " 2 "', '3, "4']
        self.assertEqual(split_csv_to_chunks(data), (data[:2], data[2:]))

    def test_simple_csv_entire_partial(self):
        data = ['"foo,bar', "1, 2", "3, 4"]
        self.assertEqual(split_csv_to_chunks(data), ([], data))
