from unittest import TestCase, mock
from lib.result_store.stores.db_store import DBReader

MOCK_RAW_CSV = 'foo,bar,baz\n"hello "" world","foo \t bar",","\n'
MOCK_CSV = [["foo", "bar", "baz"], ['hello " world', "foo \t bar", ","]]


def mock_get_key_value_store(key: str):
    key_value_store_mock = mock.MagicMock()
    key_value_store_mock.value = MOCK_RAW_CSV
    return key_value_store_mock


class DBReaderTestCase(TestCase):
    def setUp(self):
        get_key_value_store_patch = mock.patch(
            "logic.result_store.get_key_value_store",
            side_effect=mock_get_key_value_store,
        )
        self.addCleanup(get_key_value_store_patch.stop)
        self.get_key_value_store_mock = get_key_value_store_patch.start()

    def test_read_csv_num_lines_not_specified(self):
        with DBReader("test") as reader:
            self.assertEqual(reader.read_csv(number_of_lines=None), MOCK_CSV)

    def test_read_csv_num_equal_to_file_length(self):
        with DBReader("test") as reader:
            self.assertEqual(reader.read_csv(number_of_lines=2), MOCK_CSV)

    def test_read_csv_num_greater_than_file_length(self):
        with DBReader("test") as reader:
            self.assertEqual(reader.read_csv(number_of_lines=3), MOCK_CSV)

    def test_read_csv_num_less_than_file_length(self):
        with DBReader("test") as reader:
            self.assertEqual(reader.read_csv(number_of_lines=1), MOCK_CSV[:1])
