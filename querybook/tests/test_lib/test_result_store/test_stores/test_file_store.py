from unittest import TestCase, mock
from lib.result_store.stores.file_store import (
    FileUploader,
    FileReader,
    FILE_STORE_PATH,
    get_file_uri,
)


class GetFileUriTestCase(TestCase):
    def test_invalid_path(self):
        with self.assertRaises(ValueError):
            get_file_uri("")

        with self.assertRaises(ValueError):
            get_file_uri("/")

    def test_uri(self):
        self.assertEqual(
            get_file_uri("hello/world/123"), f"{FILE_STORE_PATH}hello/world/123"
        )
        self.assertEqual(get_file_uri("hello"), f"{FILE_STORE_PATH}hello")


class FileUploaderTestCase(TestCase):
    def setUp(self):
        mkdir_patch = mock.patch("lib.result_store.stores.file_store.os.makedirs")
        self.mock_os_mkdir = mkdir_patch.start()
        self.addCleanup(mkdir_patch.stop)

        path_patch = mock.patch("lib.result_store.stores.file_store.os.path.exists")
        self.mock_path_exists = path_patch.start()
        self.mock_path_exists.return_value = False
        self.addCleanup(path_patch.stop)

    def test_simple_start(self):
        uploader = FileUploader("hello/world/123")
        uploader.start()
        uploader.end()

        self.mock_os_mkdir.assert_called_with(
            f"{FILE_STORE_PATH}hello/world", exist_ok=True
        )

        uploader = FileUploader("file")
        uploader.start()
        uploader.end()

        # Removed trailing slash from FILE_STORE_PATH
        self.mock_os_mkdir.assert_called_with(FILE_STORE_PATH[:-1], exist_ok=True)

    def test_uri_dir_path(self):
        uploader = FileUploader("hello/world/123")
        self.assertEqual(uploader.uri_dir_path, f"{FILE_STORE_PATH}hello/world")

        uploader = FileUploader("hello")
        self.assertEqual(uploader.uri_dir_path, FILE_STORE_PATH[:-1])

    def test_simple_write_value(self):
        mock_file_content = ""

        def mock_write_file(s: str):
            nonlocal mock_file_content
            mock_file_content += s

        with mock.patch("builtins.open", mock.mock_open()) as m:
            m.return_value.write.side_effect = mock_write_file

            uploader = FileUploader("test/path")
            uploader.start()

            uploader.write("foo,bar,baz\n")
            uploader.write('"hello world", "foo\nbar", ","\n')

            uploader.end()

        m.assert_called_with(f"{FILE_STORE_PATH}test/path", "a")
        self.assertEqual(
            mock_file_content, 'foo,bar,baz\n"hello world", "foo\nbar", ","\n'
        )


class FileReaderTestCase(TestCase):
    mock_raw_csv = 'foo,bar,baz\n"hello "" world","foo \t bar",","\n'
    mock_csv = [["foo", "bar", "baz"], ['hello " world', "foo \t bar", ","]]

    def test_read_lines(self):
        with mock.patch("builtins.open", mock.mock_open(read_data=self.mock_raw_csv)):
            reader = FileReader("test")
            self.assertEqual(reader.read_lines(1), ["foo,bar,baz\n"])
            self.assertEqual(
                reader.read_lines(3),
                ["foo,bar,baz\n", '"hello "" world","foo \t bar",","\n'],
            )

    def test_read_csv(self):
        with mock.patch("builtins.open", mock.mock_open(read_data=self.mock_raw_csv)):
            reader = FileReader("test")
            self.assertEqual(reader.read_csv(0), [])

    def test_read_csv_with_num_lines_not_specified(self):
        with mock.patch("builtins.open", mock.mock_open(read_data=self.mock_raw_csv)):
            reader = FileReader("test")
            self.assertEqual(reader.read_csv(None), self.mock_csv)
