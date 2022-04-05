from unittest import TestCase, mock
from env import QuerybookSettings
from lib.result_store.stores.s3_store import S3Reader


class S3FileReaderTestCase(TestCase):
    def setUp(self):
        s3_file_reader_patch = mock.patch(
            "clients.s3_client.S3FileReader",
        )
        self.addCleanup(s3_file_reader_patch.stop)
        self.s3_file_reader_mock = s3_file_reader_patch.start()

    def test_set_max_read_size_to_none(self):
        with S3Reader("test_uri", max_read_size=None) as reader:
            self.s3_file_reader_mock.assert_called_once_with(
                QuerybookSettings.STORE_BUCKET_NAME, reader.uri, max_read_size=None
            )

    def test_set_max_read_size_not_set(self):
        with S3Reader("test_uri") as reader:
            self.s3_file_reader_mock.assert_called_once_with(
                QuerybookSettings.STORE_BUCKET_NAME, reader.uri
            )

    def test_set_max_read_size_set_to_value(self):
        with S3Reader("test_uri", max_read_size=5) as reader:
            self.s3_file_reader_mock.assert_called_once_with(
                QuerybookSettings.STORE_BUCKET_NAME, reader.uri, max_read_size=5
            )
