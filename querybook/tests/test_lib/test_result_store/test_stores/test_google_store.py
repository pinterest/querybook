from unittest import TestCase, mock
from env import QuerybookSettings
from lib.result_store.stores.google_store import GoogleReader


class GoogleReaderTestCase(TestCase):
    def setUp(self):
        google_download_client_patch = mock.patch(
            "clients.google_client.GoogleDownloadClient",
        )
        self.addCleanup(google_download_client_patch.stop)
        self.google_download_client_mock = google_download_client_patch.start()

    def test_set_max_read_size_to_none(self):
        with GoogleReader("test_uri", max_read_size=None) as reader:
            self.google_download_client_mock.assert_called_once_with(
                QuerybookSettings.STORE_BUCKET_NAME, reader.uri, max_read_size=None
            )

    def test_set_max_read_size_not_set(self):
        with GoogleReader("test_uri") as reader:
            self.google_download_client_mock.assert_called_once_with(
                QuerybookSettings.STORE_BUCKET_NAME, reader.uri
            )

    def test_set_max_read_size_set_to_value(self):
        with GoogleReader("test_uri", max_read_size=5) as reader:
            self.google_download_client_mock.assert_called_once_with(
                QuerybookSettings.STORE_BUCKET_NAME, reader.uri, max_read_size=5
            )
